import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pantry.db");
db.pragma('foreign_keys = ON');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS households (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    household_id TEXT,
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    household_id TEXT NOT NULL,
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location_id TEXT NOT NULL,
    FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    storageCategory TEXT,
    shoppingCategory TEXT,
    icon TEXT,
    unit_type TEXT,
    store TEXT,
    household_id TEXT NOT NULL,
    UNIQUE(name, household_id),
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    storageCategory TEXT,
    shoppingCategory TEXT,
    icon TEXT,
    quantity REAL DEFAULT 0,
    unit_type TEXT,
    zone_id TEXT NOT NULL,
    expiry_date TEXT,
    low_stock_threshold REAL DEFAULT 0,
    household_id TEXT NOT NULL,
    FOREIGN KEY(zone_id) REFERENCES zones(id) ON DELETE CASCADE,
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  CREATE TABLE IF NOT EXISTS shopping_list (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    storageCategory TEXT,
    shoppingCategory TEXT,
    icon TEXT,
    quantity REAL DEFAULT 1,
    unit_type TEXT,
    store TEXT,
    household_id TEXT NOT NULL,
    purchased INTEGER DEFAULT 0,
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT,
    ingredients TEXT,
    household_id TEXT NOT NULL,
    FOREIGN KEY(household_id) REFERENCES households(id)
  );

  -- Migration: Ensure all locations have at least one zone
  INSERT INTO zones (id, name, location_id)
  SELECT lower(hex(randomblob(16))), 'General', id
  FROM locations
  WHERE id NOT IN (SELECT DISTINCT location_id FROM zones);

  -- Migration: Move emojis from names to icon column if icon is null
  UPDATE locations 
  SET icon = SUBSTR(name, 1, 2), 
      name = TRIM(SUBSTR(name, 3))
  WHERE icon IS NULL AND name LIKE '🌬️%' OR name LIKE '❄️%' OR name LIKE '🥫%' OR name LIKE '🛍️%' OR name LIKE '🧼%' OR name LIKE '🛏️%' OR name LIKE '🧺%' OR name LIKE '🍷%' OR name LIKE '📦%' OR name LIKE '🏠%';
`);

// Better way to handle migrations in SQLite with better-sqlite3
try { db.prepare("ALTER TABLE households ADD COLUMN invite_code TEXT").run(); } catch (e) {}
try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code)").run(); } catch (e) {}
try { db.prepare("ALTER TABLE shopping_list ADD COLUMN store TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE shopping_list ADD COLUMN unit_type TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE items ADD COLUMN unit_type TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE items ADD COLUMN low_stock_threshold REAL DEFAULT 0").run(); } catch (e) {}

// Dual Category Migrations
try { db.prepare("ALTER TABLE library ADD COLUMN storageCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE library ADD COLUMN shoppingCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE items ADD COLUMN storageCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE items ADD COLUMN shoppingCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE locations ADD COLUMN icon TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE shopping_list ADD COLUMN storageCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE shopping_list ADD COLUMN shoppingCategory TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE library ADD COLUMN store TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE shopping_list ADD COLUMN item_id TEXT").run(); } catch (e) {}

// Data Migration: Copy old category to new categories if they are null
try { db.prepare("UPDATE library SET storageCategory = category, shoppingCategory = category WHERE storageCategory IS NULL").run(); } catch (e) {}
try { db.prepare("UPDATE items SET storageCategory = category, shoppingCategory = category WHERE storageCategory IS NULL").run(); } catch (e) {}
try { db.prepare("UPDATE shopping_list SET storageCategory = category, shoppingCategory = category WHERE storageCategory IS NULL").run(); } catch (e) {}


function generateInviteCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < 2; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += "-";
  for (let i = 0; i < 4; i++) code += digits.charAt(Math.floor(Math.random() * digits.length));
  return code;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User/Household Management
  app.post("/api/auth", (req, res) => {
    const { email } = req.body;
    console.log(`[AUTH] Request received for email: ${email}`);
    
    try {
      if (!email || typeof email !== 'string') {
        console.warn("[AUTH] Invalid email provided:", email);
        return res.status(400).json({ error: "Valid email is required" });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`[AUTH] Searching for user: ${normalizedEmail}`);
      
      let user;
      try {
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as any;
      } catch (dbError: any) {
        console.error("[AUTH] Database error during SELECT:", dbError);
        throw new Error("Database lookup failed");
      }

      if (!user) {
        console.log(`[AUTH] User not found, creating: ${normalizedEmail}`);
        const id = uuidv4();
        try {
          db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run(id, normalizedEmail);
          user = { id, email: normalizedEmail, household_id: null, household_name: null };
          console.log(`[AUTH] New user created with ID: ${id}`);
        } catch (dbError: any) {
          console.error("[AUTH] Database error during INSERT:", dbError);
          throw new Error("User creation failed");
        }
      } else {
        console.log(`[AUTH] User found with ID: ${user.id}`);
        if (user.household_id) {
          const household = db.prepare("SELECT name FROM households WHERE id = ?").get(user.household_id) as any;
          user.household_name = household?.name || null;
          
          // Check if household has missing storage units
          const existingLocations = db.prepare("SELECT name FROM locations WHERE household_id = ?").all(user.household_id) as any[];
          const existingNames = existingLocations.map(l => l.name);
          
          if (existingLocations.length < 5) {
            const defaultLocations = [
              { name: "Shopping Bags", icon: "🛍️", zone: "General" },
              { name: "Fridge", icon: "🌬️", zone: "Shelves" },
              { name: "Freezer", icon: "❄️", zone: "Drawers" },
              { name: "Cupboard", icon: "🥫", zone: "Shelves" },
              { name: "Other", icon: "📦", zone: "General" }
            ];

            for (const loc of defaultLocations) {
              // Check if a location with a similar name already exists (ignoring emojis)
              const baseName = loc.name.replace(/^[^\w\s]+/, '').trim();
              if (!existingNames.some(n => n.includes(baseName))) {
                const locId = uuidv4();
                db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
                  .run(locId, loc.name, loc.icon, user.household_id);
                db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
                  .run(uuidv4(), loc.zone, locId);
              }
            }
          }
        } else {
          user.household_name = null;
        }
      }

      console.log(`[AUTH] Success for ${normalizedEmail}`);
      return res.json(user);
    } catch (error: any) {
      console.error("[AUTH] Fatal error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/households/:id", (req, res) => {
    const household = db.prepare("SELECT * FROM households WHERE id = ?").get(req.params.id) as any;
    if (!household) return res.status(404).json({ error: "Household not found" });
    res.json(household);
  });

  app.post("/api/households", (req, res) => {
    const { name, userId } = req.body;
    const householdId = uuidv4();
    const inviteCode = generateInviteCode();
    db.prepare("INSERT INTO households (id, name, invite_code) VALUES (?, ?, ?)").run(householdId, name, inviteCode);
    db.prepare("UPDATE users SET household_id = ? WHERE id = ?").run(householdId, userId);
    
    // Create default locations
    const defaultLocations = [
      { name: "Shopping Bags", icon: "🛍️", zone: "General" },
      { name: "Fridge", icon: "🌬️", zone: "Shelves" },
      { name: "Freezer", icon: "❄️", zone: "Drawers" },
      { name: "Cupboard", icon: "🥫", zone: "Shelves" },
      { name: "Other", icon: "📦", zone: "General" }
    ];

    for (const loc of defaultLocations) {
      const locId = uuidv4();
      db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
        .run(locId, loc.name, loc.icon, householdId);
      db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
        .run(uuidv4(), loc.zone, locId);
    }
      
    res.json({ id: householdId, name, invite_code: inviteCode });
  });

  app.post("/api/households/join", (req, res) => {
    const { inviteCode, userId } = req.body;
    const household = db.prepare("SELECT * FROM households WHERE invite_code = ?").get(inviteCode) as any;
    if (!household) return res.status(404).json({ error: "Invalid invite code" });
    db.prepare("UPDATE users SET household_id = ? WHERE id = ?").run(household.id, userId);
    res.json({ id: household.id, name: household.name, invite_code: household.invite_code });
  });

  app.patch("/api/households/:id", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE households SET name = ? WHERE id = ?").run(name, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
   app.use(express.static(__dirname));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  const clients = new Map<string, Set<WebSocket>>();

  wss.on("connection", (ws) => {
    let currentHouseholdId: string | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());

      if (data.type === "subscribe") {
        currentHouseholdId = data.householdId;

        if (currentHouseholdId) {
          // Ensure household exists in the database to satisfy FOREIGN KEY constraints
          const exists = db.prepare("SELECT id FROM households WHERE id = ?").get(currentHouseholdId);
          if (!exists) {
            db.prepare("INSERT INTO households (id, name) VALUES (?, ?)")
              .run(currentHouseholdId, currentHouseholdId === 'dummy-household' ? "Dummy Household" : "My Household");
          }

          // Check if household has missing storage units
          const existingLocations = db.prepare("SELECT name FROM locations WHERE household_id = ?").all(currentHouseholdId) as any[];
          const existingNames = existingLocations.map(l => l.name);
          
          if (existingLocations.length < 5) {
            const defaultLocations = [
              { name: "Shopping Bags", icon: "🛍️", zone: "General" },
              { name: "Fridge", icon: "🌬️", zone: "Shelves" },
              { name: "Freezer", icon: "❄️", zone: "Drawers" },
              { name: "Cupboard", icon: "🥫", zone: "Shelves" },
              { name: "Other", icon: "📦", zone: "General" }
            ];

            for (const loc of defaultLocations) {
              const baseName = loc.name.replace(/^[^\w\s]+/, '').trim();
              if (!existingNames.some(n => n.includes(baseName))) {
                const locId = uuidv4();
                db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
                  .run(locId, loc.name, loc.icon, currentHouseholdId);
                db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
                  .run(uuidv4(), loc.zone, locId);
              }
            }
          }
        }

        if (!clients.has(currentHouseholdId!)) {
          clients.set(currentHouseholdId!, new Set());
        }
        clients.get(currentHouseholdId!)!.add(ws);
        
        // Send initial state
        const state = getHouseholdState(currentHouseholdId!);
        ws.send(JSON.stringify({ type: "init", state }));
      }

      if (data.type === "action") {
        if (!currentHouseholdId) {
          console.error("Action received before subscription");
          return;
        }
        handleAction(data.action, currentHouseholdId);
        broadcast(currentHouseholdId, { type: "update", state: getHouseholdState(currentHouseholdId) });
      }
    });

    ws.on("close", () => {
      if (currentHouseholdId && clients.has(currentHouseholdId)) {
        clients.get(currentHouseholdId)!.delete(ws);
      }
    });
  });

  function getHouseholdState(householdId: string) {
    const locations = db.prepare("SELECT * FROM locations WHERE household_id = ?").all(householdId);
    const zones = db.prepare(`
      SELECT z.* FROM zones z 
      JOIN locations l ON z.location_id = l.id 
      WHERE l.household_id = ?
    `).all(householdId);
    const items = db.prepare("SELECT * FROM items WHERE household_id = ?").all(householdId);
    const shoppingList = db.prepare("SELECT * FROM shopping_list WHERE household_id = ?").all(householdId);
    const library = db.prepare("SELECT * FROM library WHERE household_id = ?").all(householdId);
    const mealPlans = db.prepare("SELECT * FROM meal_plans WHERE household_id = ?").all(householdId);
    
    return { locations, zones, items, shoppingList, library, mealPlans };
  }

  function handleAction(action: any, householdId: string) {
    const { type, payload } = action;
    console.log(`Handling action: ${type} for household: ${householdId}`, payload);
    
    switch (type) {
      case "ADD_LOCATION":
        const locId = uuidv4();
        db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
          .run(locId, payload.name, payload.icon || '🏠', householdId);
        // Automatically create a default zone so users can add items immediately
        db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
          .run(uuidv4(), "General", locId);
        break;
      case "UPDATE_LOCATION":
        if (payload.name === "Shopping Bags" || payload.name === "🛍️ Shopping Bags") {
          // Guardrail: Prevent renaming Shopping Bags
          const current = db.prepare("SELECT name FROM locations WHERE id = ?").get(payload.id) as any;
          if (current && (current.name === "Shopping Bags" || current.name === "🛍️ Shopping Bags")) break;
        }
        db.prepare("UPDATE locations SET name = ?, icon = ? WHERE id = ?").run(payload.name, payload.icon, payload.id);
        break;
      case "DELETE_LOCATION":
        const locationToDelete = db.prepare("SELECT * FROM locations WHERE id = ?").get(payload.id) as any;
        if (locationToDelete && (locationToDelete.name === "Shopping Bags" || locationToDelete.name === "🛍️ Shopping Bags")) {
          // Guardrail: Prevent deleting Shopping Bags
          break;
        }

        // 1. Find or create "📦 Other" location
        let otherLoc = db.prepare("SELECT id FROM locations WHERE name = ? AND household_id = ?").get("📦 Other", householdId) as any;
        if (!otherLoc) {
          const newLocId = uuidv4();
          db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
            .run(newLocId, "📦 Other", "📦", householdId);
          otherLoc = { id: newLocId };
        }

        // 2. Find or create "General" zone in "📦 Other"
        let otherZone = db.prepare("SELECT id FROM zones WHERE name = ? AND location_id = ?").get("General", otherLoc.id) as any;
        if (!otherZone) {
          const newZoneId = uuidv4();
          db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
            .run(newZoneId, "General", otherLoc.id);
          otherZone = { id: newZoneId };
        }

        // 3. Move all items from all zones of the location to be deleted to the "Other" General zone
        const zonesToDelete = db.prepare("SELECT id FROM zones WHERE location_id = ?").all(payload.id) as any[];
        for (const zone of zonesToDelete) {
          db.prepare("UPDATE items SET zone_id = ? WHERE zone_id = ?").run(otherZone.id, zone.id);
        }

        // 4. Delete the location (cascades to zones)
        db.prepare("DELETE FROM locations WHERE id = ?").run(payload.id);
        break;
      case "ADD_ZONE":
        db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
          .run(uuidv4(), payload.name, payload.location_id || payload.locationId);
        break;
      case "DELETE_ZONE":
        db.prepare("DELETE FROM zones WHERE id = ?").run(payload.id);
        break;
      case "ADD_ITEM":
        // Duplicate Aggregator: Check if item with same name (case-insensitive), storageCategory, and zone_id exists
        const existingItem = db.prepare(`
          SELECT * FROM items 
          WHERE LOWER(name) = LOWER(?) 
          AND storageCategory = ? 
          AND zone_id = ? 
          AND household_id = ?
        `).get(payload.name, payload.storageCategory, payload.zone_id ?? payload.zoneId, householdId) as any;

        if (existingItem) {
          db.prepare("UPDATE items SET quantity = quantity + ? WHERE id = ?")
            .run(payload.quantity ?? 0, existingItem.id);
        } else {
          const itemId = payload.id || uuidv4();
          db.prepare(`
            INSERT INTO items (id, name, storageCategory, shoppingCategory, icon, quantity, unit_type, zone_id, expiry_date, low_stock_threshold, household_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            itemId, 
            payload.name, 
            payload.storageCategory, 
            payload.shoppingCategory, 
            payload.icon, 
            payload.quantity ?? 0, 
            payload.unit_type ?? payload.unitType ?? 'items', 
            payload.zone_id ?? payload.zoneId, 
            payload.expiry_date ?? payload.expiryDate ?? null, 
            payload.low_stock_threshold ?? payload.lowStockThreshold ?? 0, 
            householdId
          );
        }
        
        // Update library
        db.prepare(`
          INSERT OR REPLACE INTO library (id, name, storageCategory, shoppingCategory, icon, unit_type, store, household_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, payload.unit_type ?? payload.unitType ?? 'items', payload.store ?? null, householdId);
        break;
      case "UPDATE_ITEM":
        db.prepare(`
          UPDATE items SET 
            name = ?, storageCategory = ?, shoppingCategory = ?, icon = ?, quantity = ?, unit_type = ?, 
            zone_id = ?, expiry_date = ?, low_stock_threshold = ?
          WHERE id = ?
        `).run(
          payload.name, 
          payload.storageCategory, 
          payload.shoppingCategory, 
          payload.icon, 
          payload.quantity ?? 0, 
          payload.unit_type ?? payload.unitType ?? 'items', 
          payload.zone_id ?? payload.zoneId, 
          payload.expiry_date ?? payload.expiryDate ?? null, 
          payload.low_stock_threshold ?? payload.lowStockThreshold ?? 0, 
          payload.id
        );
        
        // Update library with latest category/icon/unit for this name
        db.prepare(`
          INSERT OR REPLACE INTO library (id, name, storageCategory, shoppingCategory, icon, unit_type, store, household_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, payload.unit_type ?? payload.unitType ?? 'items', payload.store ?? null, householdId);

        // Check low stock
        const lowStockThreshold = payload.low_stock_threshold ?? payload.lowStockThreshold ?? 0;
        if (payload.quantity <= lowStockThreshold) {
          const existing = db.prepare("SELECT * FROM shopping_list WHERE name = ? AND household_id = ? AND purchased = 0")
            .get(payload.name, householdId);
          if (!existing) {
            db.prepare("INSERT INTO shopping_list (id, name, storageCategory, shoppingCategory, icon, quantity, unit_type, store, household_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
              .run(uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, 1, payload.unit_type ?? payload.unitType ?? 'items', null, householdId);
          }
        }
        break;
      case "DELETE_ITEM":
        db.prepare("DELETE FROM items WHERE id = ?").run(payload.id);
        break;
      case "TRANSFER_ITEM":
        db.prepare("UPDATE items SET zone_id = ? WHERE id = ?").run(payload.target_zone_id || payload.targetZoneId, payload.item_id || payload.itemId);
        break;
      case "BULK_TRANSFER_ITEMS":
        const { itemIds, targetZoneId } = payload;
        const stmt = db.prepare("UPDATE items SET zone_id = ? WHERE id = ?");
        const bulkUpdate = db.transaction((ids: string[], zoneId: string) => {
          for (const id of ids) {
            stmt.run(zoneId, id);
          }
        });
        bulkUpdate(itemIds, targetZoneId);
        break;
      case "ADD_TO_SHOPPING":
        // Duplicate Aggregator: Check if item with same name (case-insensitive) and shoppingCategory exists
        const existingShopping = db.prepare("SELECT * FROM shopping_list WHERE LOWER(name) = LOWER(?) AND shoppingCategory = ? AND household_id = ? AND purchased = 0")
          .get(payload.name, payload.shoppingCategory, householdId) as any;
        
        if (existingShopping) {
          db.prepare("UPDATE shopping_list SET quantity = quantity + ?, item_id = COALESCE(item_id, ?) WHERE id = ?")
            .run(payload.quantity ?? 1, payload.item_id || payload.itemId || null, existingShopping.id);
        } else {
          db.prepare("INSERT INTO shopping_list (id, name, storageCategory, shoppingCategory, icon, quantity, unit_type, store, item_id, household_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .run(payload.id || uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, payload.quantity ?? 1, payload.unit_type ?? payload.unitType ?? 'items', payload.store ?? null, payload.item_id || payload.itemId || null, householdId);
        }

        // Update library
        db.prepare(`
          INSERT OR REPLACE INTO library (id, name, storageCategory, shoppingCategory, icon, unit_type, store, household_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, payload.unit_type ?? payload.unitType ?? 'items', payload.store ?? null, householdId);
        break;
      case "UPDATE_SHOPPING_ITEM":
        if (payload.name !== undefined) {
          db.prepare(`
            UPDATE shopping_list SET 
              name = ?, storageCategory = ?, shoppingCategory = ?, icon = ?, quantity = ?, unit_type = ?, store = ?
            WHERE id = ?
          `).run(
            payload.name,
            payload.storageCategory,
            payload.shoppingCategory,
            payload.icon,
            payload.quantity,
            payload.unit_type ?? payload.unitType ?? 'items',
            payload.store ?? null,
            payload.id
          );

          // Update library
          db.prepare(`
            INSERT OR REPLACE INTO library (id, name, storageCategory, shoppingCategory, icon, unit_type, store, household_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), payload.name, payload.storageCategory, payload.shoppingCategory, payload.icon, payload.unit_type ?? payload.unitType ?? 'items', payload.store ?? null, householdId);
        } else {
          db.prepare("UPDATE shopping_list SET quantity = ? WHERE id = ?")
            .run(payload.quantity, payload.id);
        }
        break;
      case "MARK_PURCHASED":
        const shoppingItem = db.prepare("SELECT * FROM shopping_list WHERE id = ?").get(payload.id) as any;
        if (shoppingItem && shoppingItem.purchased === 0) {
          // 1. Find or create "Shopping Bags" location
          let putAwayLoc = db.prepare("SELECT id FROM locations WHERE (name = ? OR name = ?) AND household_id = ?").get("Shopping Bags", "🛍️ Shopping Bags", householdId) as any;
          if (!putAwayLoc) {
            const newLocId = uuidv4();
            db.prepare("INSERT INTO locations (id, name, icon, household_id) VALUES (?, ?, ?, ?)")
              .run(newLocId, "Shopping Bags", "🛍️", householdId);
            putAwayLoc = { id: newLocId };
          }

          // 2. Find or create "General" zone in "Shopping Bags"
          let putAwayZone = db.prepare("SELECT id FROM zones WHERE name = ? AND location_id = ?").get("General", putAwayLoc.id) as any;
          if (!putAwayZone) {
            const newZoneId = uuidv4();
            db.prepare("INSERT INTO zones (id, name, location_id) VALUES (?, ?, ?)")
              .run(newZoneId, "General", putAwayLoc.id);
            putAwayZone = { id: newZoneId };
          }

          // 3. Add to items table or update existing
          let existingItem = shoppingItem.item_id ? db.prepare("SELECT * FROM items WHERE id = ?").get(shoppingItem.item_id) as any : null;
          
          // Fallback: if no item_id, check if an item with same name exists in the target zone
          if (!existingItem) {
            existingItem = db.prepare("SELECT * FROM items WHERE name = ? AND zone_id = ? AND household_id = ?")
              .get(shoppingItem.name, putAwayZone.id, householdId) as any;
          }

          if (existingItem) {
            db.prepare(`
              UPDATE items SET 
                zone_id = ?, 
                quantity = quantity + ?,
                storageCategory = COALESCE(storageCategory, ?),
                shoppingCategory = COALESCE(shoppingCategory, ?),
                icon = COALESCE(icon, ?)
              WHERE id = ?
            `).run(
              putAwayZone.id, 
              shoppingItem.quantity,
              shoppingItem.storageCategory,
              shoppingItem.shoppingCategory,
              shoppingItem.icon,
              existingItem.id
            );
            // Link it back if it wasn't linked
            if (!shoppingItem.item_id) {
              db.prepare("UPDATE shopping_list SET item_id = ? WHERE id = ?").run(existingItem.id, shoppingItem.id);
            }
          } else {
            const newItemId = uuidv4();
            db.prepare(`
              INSERT INTO items (id, name, storageCategory, shoppingCategory, icon, quantity, unit_type, zone_id, household_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              newItemId, 
              shoppingItem.name, 
              shoppingItem.storageCategory, 
              shoppingItem.shoppingCategory, 
              shoppingItem.icon, 
              shoppingItem.quantity, 
              shoppingItem.unit_type, 
              putAwayZone.id, 
              householdId
            );
            // Link it back
            db.prepare("UPDATE shopping_list SET item_id = ? WHERE id = ?").run(newItemId, shoppingItem.id);
          }

          // 4. Mark as purchased
          db.prepare("UPDATE shopping_list SET purchased = 1 WHERE id = ?").run(payload.id);
        }
        break;
      case "CLEAR_PURCHASED":
        db.prepare("DELETE FROM shopping_list WHERE household_id = ? AND purchased = 1").run(householdId);
        break;
      case "DELETE_SHOPPING_ITEM":
        db.prepare("DELETE FROM shopping_list WHERE id = ?").run(payload.id);
        break;
      case "UPDATE_MEAL_PLAN":
        db.prepare(`
          INSERT OR REPLACE INTO meal_plans (id, date, meal_type, name, ingredients, household_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(payload.id, payload.date, payload.meal_type, payload.name, payload.ingredients, householdId);
        break;
      case "DELETE_MEAL_PLAN":
        db.prepare("DELETE FROM meal_plans WHERE id = ? AND household_id = ?").run(payload.id, householdId);
        break;
    }
  }

  function broadcast(householdId: string, message: any) {
    const householdClients = clients.get(householdId);
    if (householdClients) {
      const msg = JSON.stringify(message);
      householdClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  }
}

startServer();

export interface Household {
  id: string;
  name: string;
  invite_code?: string;
  locations: Location[];
  shoppingList: ShoppingItem[];
}

export interface User {
  id: string;
  email: string;
  household_id: string | null;
  household_name: string | null;
}

export interface Location {
  id: string;
  name: string;
  household_id: string;
  icon?: string;
  type: string;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  location_id: string;
  items: Item[];
}

export interface Item {
  id: string;
  name: string;
  storageCategory: string;
  shoppingCategory: string;
  category: string;
  icon: string;
  quantity: number;
  unit_type: string;
  zone_id: string;
  expiry: string | null;
  expiry_date: string | null;
  low_stock_threshold: number;
  household_id: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  storageCategory: string;
  shoppingCategory: string;
  icon: string;
  quantity: number;
  unit_type: string;
  store: string | null;
  household_id: string;
  purchased: number;
  item_id: string | null;
}

export interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  name: string;
  ingredients: string; // JSON stringified array of objects { name: string, category: string }
  household_id: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
  defaultUnit?: string | null;
  storageCategory?: string;
  shoppingCategory?: string;
  icon?: string;
  unit_type?: string;
  store?: string | null;
  household_id?: string;
}

export interface PantryState {
  locations: Location[];
  zones: Zone[];
  items: Item[];
  shoppingList: ShoppingItem[];
  library: LibraryItem[];
  mealPlans: MealPlan[];
}

// Redundant CATEGORIES removed - see @/utils/categories

export const OFFICIAL_ICONS = [
  { icon: '🌬️', label: 'Fridge', keywords: ['fridge', 'refrigerator', 'chiller'] },
  { icon: '❄️', label: 'Freezer', keywords: ['freezer', 'ice', 'frozen'] },
  { icon: '🥫', label: 'Cupboard', keywords: ['cupboard', 'pantry', 'shelf', 'cabinet', 'larder'] },
  { icon: '🛍️', label: 'Shopping Bags', keywords: ['shopping', 'bags', 'bag', 'cart'] },
  { icon: '🧼', label: 'Bathroom', keywords: ['bathroom', 'toilet', 'shower', 'bath'] },
  { icon: '🛏️', label: 'Bedroom', keywords: ['bedroom', 'bed', 'sleep'] },
  { icon: '🧺', label: 'Utility Room', keywords: ['utility', 'laundry', 'washing', 'cleaning'] },
  { icon: '🍷', label: 'Wine Cellar', keywords: ['wine', 'cellar', 'alcohol', 'drinks'] },
  { icon: '📦', label: 'Other / Garage', keywords: ['other', 'garage', 'box', 'storage', 'shed'] },
  { icon: '🏠', label: 'General Household', keywords: ['general', 'household', 'home', 'house'] }
];

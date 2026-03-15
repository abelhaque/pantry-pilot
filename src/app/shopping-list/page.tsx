'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Filter, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  MoreVertical, 
  Search 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// --- Category definitions (ported from fallback types.ts) ---
const CATEGORIES = [
    { name: 'Meat', icon: '🥩' },
    { name: 'Fish', icon: '🐟' },
    { name: 'Veg', icon: '🥦' },
    { name: 'Fruit', icon: '🍎' },
    { name: 'Dairy', icon: '🧀' },
    { name: 'Bakery', icon: '🍞' },
    { name: 'Pasta & Grains', icon: '🍝' },
    { name: 'Tins & Jars', icon: '🥫' },
    { name: 'Baking & Flour', icon: '🥣' },
    { name: 'Spices & Seasoning', icon: '🧂' },
    { name: 'Sauces & Oils', icon: '🍯' },
    { name: 'Snacks', icon: '🥨' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Ready Meals', icon: '🍱' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Coffee & Tea', icon: '☕' },
    { name: 'Frozen', icon: '❄️' },
    { name: 'Cleaning', icon: '🧼' },
    { name: 'Personal Care', icon: '🧖' },
    { name: 'Household', icon: '🔋' },
    { name: 'Pet Care', icon: '🐾' },
    { name: 'Other', icon: '📦' },
]

const CATEGORY_ORDER = CATEGORIES.map(c => c.name)

// Haptic + sound (ported from fallback)
const playSuccess = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
        osc.connect(gain); gain.connect(audioCtx.destination)
        osc.start(); osc.stop(audioCtx.currentTime + 0.1)
    } catch (e) {}
}

// --- Inline components ported from fallback ---
const Card = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div onClick={onClick} className={`rounded-[20px] p-4 tactile-card ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        {children}
    </div>
)

const GroupHeader = ({ title, icon }: { title: string; icon: string }) => (
    <div className="tactile-card rounded-2xl px-5 py-3 flex items-center gap-3 mb-6 sticky top-20 z-10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{icon}</div>
        <h3 className="font-bold text-charcoal uppercase text-xs tracking-widest">{title}</h3>
    </div>
)

interface ShoppingItem {
    id: string
    name: string
    quantity: number
    unit: string
    category: string
    isPurchased: boolean
    storeId?: string | null
    store?: { id: string; name: string } | null
}

interface Store {
    id: string
    name: string
}

export default function ShoppingList() {
    const { household } = useHousehold()
    const router = useRouter()

    const [items, setItems] = useState<ShoppingItem[]>([])
    const [stores, setStores] = useState<Store[]>([])
    const [newItemName, setNewItemName] = useState('')
    const [isStoreSortingEnabled, setIsStoreSortingEnabled] = useState(false)
    const [selectedStoreFilter, setSelectedStoreFilter] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => { setHydrated(true) }, [])

    const fetchList = async () => {
        if (!household?.id) return
        try {
            const res = await fetch(`/api/shopping-list?householdId=${household.id}`)
            if (res.ok) setItems(await res.json())
        } catch { /* non-fatal */ }
    }

    const fetchStores = async () => {
        if (!household?.id) return
        try {
            const res = await fetch(`/api/stores?householdId=${household.id}`)
            if (res.ok) setStores(await res.json())
        } catch { /* non-fatal */ }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchList()
        fetchStores()
    }, [household])

    // --- Smart category inference (from fallback SMART_AUTO_CATEGORIES) ---
    const inferCategory = (name: string): string => {
        const lower = name.toLowerCase()
        if (['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'].some(k => lower.includes(k))) return 'Dairy'
        if (['chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'bacon', 'mince', 'fish', 'salmon', 'tuna', 'meat', 'prawn'].some(k => lower.includes(k))) return 'Meat'
        if (['apple', 'banana', 'carrot', 'onion', 'potato', 'pepper', 'tomato', 'fruit', 'veg', 'salad', 'berry', 'broccoli', 'lettuce', 'mushroom', 'garlic'].some(k => lower.includes(k))) return 'Veg'
        if (['bread', 'bagel', 'croissant', 'muffin', 'loaf', 'roll', 'bun', 'naan', 'pitta', 'wrap'].some(k => lower.includes(k))) return 'Bakery'
        if (['pasta', 'rice', 'cereal', 'oats', 'bean', 'lentil'].some(k => lower.includes(k))) return 'Pasta & Grains'
        if (['flour', 'sugar', 'baking'].some(k => lower.includes(k))) return 'Baking & Flour'
        if (['oil', 'sauce', 'honey', 'jam'].some(k => lower.includes(k))) return 'Sauces & Oils'
        if (['soup', 'tin', 'can', 'stock'].some(k => lower.includes(k))) return 'Tins & Jars'
        if (['spice', 'salt', 'pepper', 'seasoning'].some(k => lower.includes(k))) return 'Spices & Seasoning'
        if (['tea', 'coffee'].some(k => lower.includes(k))) return 'Coffee & Tea'
        if (['water', 'juice', 'soda', 'coke', 'wine', 'beer'].some(k => lower.includes(k))) return 'Drinks'
        if (['toothpaste', 'shampoo', 'shower', 'deodorant', 'soap', 'lotion'].some(k => lower.includes(k))) return 'Personal Care'
        if (['detergent', 'bleach', 'cleaner', 'sponge', 'wipe', 'tissue', 'foil', 'bag', 'battery'].some(k => lower.includes(k))) return 'Household'
        if (['dog', 'cat', 'pet', 'kibble', 'litter'].some(k => lower.includes(k))) return 'Pet Care'
        return 'Other'
    }

    const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const input = (form.elements.namedItem('quickAdd') as HTMLInputElement).value.trim()
        if (!input || !household?.id) return

        // Parse "2 kg Milk" or just "Milk" — exact fallback parser
        const match = input.match(/^([\d.]+)?\s*([a-zA-Z]+)?\s*(.+)$/)
        let name = input, quantity = 1, unit = 'items'
        if (match) {
            const q = parseFloat(match[1])
            const u = match[2]?.toLowerCase()
            const n = match[3]
            const validUnits = ['g', 'kg', 'ml', 'l', 'oz', 'lb', 'cups', 'tbsp', 'tsp', 'items']
            if (!isNaN(q) && u && validUnits.includes(u)) { quantity = q; unit = u; name = n }
            else if (!isNaN(q) && !u) { quantity = q; name = n }
        }

        const category = inferCategory(name)
        try {
            await fetch('/api/shopping-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    householdId: household.id,
                    quantity,
                    unit,
                    category,
                    storeId: selectedStoreFilter ?? null
                })
            })
            form.reset()
            playSuccess()
            try { navigator.vibrate(15) } catch {}
            fetchList()
        } catch { /* non-fatal */ }
    }

    const markPurchased = async (item: ShoppingItem) => {
        await fetch('/api/shopping-list', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, isPurchased: !item.isPurchased })
        })
        fetchList()
    }

    const deleteItem = async (id: string) => {
        await fetch(`/api/shopping-list?id=${id}`, { method: 'DELETE' })
        fetchList()
    }

    if (!household) {
        return <div className="flex items-center justify-center min-h-screen text-charcoal font-black uppercase tracking-widest animate-pulse">Loading...</div>
    }

    // --- Exact fallback aisle-grouping logic ---
    const unpurchased = (items || []).filter(i =>
        !i.isPurchased &&
        (!selectedStoreFilter || i.storeId === selectedStoreFilter || i.store?.id === selectedStoreFilter)
    )
    const purchasedItems = (items || []).filter(i => i.isPurchased)

    const sortAisles = (groups: Record<string, ShoppingItem[]>) =>
        Object.keys(groups).sort((a, b) => {
            const ia = CATEGORY_ORDER.indexOf(a as any)
            const ib = CATEGORY_ORDER.indexOf(b as any)
            if (ia === -1 && ib === -1) return a.localeCompare(b)
            if (ia === -1) return 1; if (ib === -1) return -1
            return ia - ib
        })

    // store name list for filter pills
    const storeNames = (stores || []).map(s => s.name)

    return (
        <main className="max-w-5xl mx-auto px-6 pt-6 pb-32 space-y-8">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-charcoal">Shopping List</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => router.push('/shopping-list/add')}
                        className="px-4 py-2 rounded-xl font-medium bg-primary text-white hover:opacity-90 flex items-center gap-2 tactile-button min-h-[44px]"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            {/* --- Group by Store toggle (exact fallback layout) --- */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isStoreSortingEnabled ? 'bg-secondary text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        <Filter size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-charcoal">Group by Store</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Organize your list by shop</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsStoreSortingEnabled(v => !v)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isStoreSortingEnabled ? 'bg-secondary' : 'bg-zinc-200'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isStoreSortingEnabled ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            {/* --- Quick Add (exact fallback parser) --- */}
            <div className="p-2 rounded-2xl tactile-card">
                <form onSubmit={handleQuickAdd} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            name="quickAdd"
                            placeholder="Quick add: '2 kg Milk' or 'Eggs'..."
                            className="w-full py-3 px-4 rounded-[20px] bg-zinc-50 border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 h-[48px] bg-primary text-white rounded-xl font-medium hover:opacity-90 tactile-button"
                    >
                        Add
                    </button>
                </form>
            </div>

            {/* --- Store filter pills --- */}
            {stores.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setSelectedStoreFilter(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedStoreFilter ? 'bg-secondary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    >
                        All Stores
                    </button>
                    {stores.map(store => (
                        <button
                            key={store.id}
                            onClick={() => setSelectedStoreFilter(selectedStoreFilter === store.id ? null : store.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${selectedStoreFilter === store.id ? 'bg-secondary text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            <Filter size={14} />
                            <span>{store.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* --- Main List: Aisle-Grouped (exact fallback logic) --- */}
            <div className="space-y-4">
                {unpurchased.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <ShoppingCart className="mx-auto text-zinc-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-zinc-500">Your list is empty</h3>
                        <p className="text-zinc-400 text-sm">Add items to start your shopping trip.</p>
                    </div>
                ) : isStoreSortingEnabled ? (
                    // --- Store → Aisle grouping (exact fallback) ---
                    (() => {
                        const storeGroups = unpurchased.reduce((acc, item) => {
                            const storeName = item.store?.name || 'Any Store'
                            if (!acc[storeName]) acc[storeName] = []
                            acc[storeName].push(item)
                            return acc
                        }, {} as Record<string, ShoppingItem[]>)

                        return Object.keys(storeGroups).sort().map(storeName => {
                            const storeItems = storeGroups[storeName]
                            const aisleGroups = storeItems.reduce((acc, item) => {
                                const cat = item.category || 'Other'
                                if (!acc[cat]) acc[cat] = []
                                acc[cat].push(item)
                                return acc
                            }, {} as Record<string, ShoppingItem[]>)
                            const sortedAisles = sortAisles(aisleGroups)

                            return (
                                <div key={storeName} className="space-y-6">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                            <ShoppingCart size={16} />
                                        </div>
                                        <h3 className="text-lg font-serif font-bold text-charcoal">{storeName}</h3>
                                    </div>
                                    <div className="pl-4 border-l-2 border-secondary/20 space-y-10">
                                        {sortedAisles.map(aisleName => {
                                            const aisleItems = aisleGroups[aisleName]
                                            const cat = CATEGORIES.find(c => c.name === aisleName)
                                            return (
                                                <div key={aisleName} className="space-y-4">
                                                    <GroupHeader title={aisleName} icon={cat?.icon ?? '📦'} />
                                                    <div className="space-y-4">
                                                        {aisleItems.map(item => (
                                                            <ShoppingItemRow key={item.id} item={item} onMark={markPurchased} onDelete={deleteItem} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })
                    })()
                ) : (
                    // --- Category-only grouping (exact fallback) ---
                    (() => {
                        const catGroups = unpurchased.reduce((acc, item) => {
                            const cat = item.category || 'Other'
                            if (!acc[cat]) acc[cat] = []
                            acc[cat].push(item)
                            return acc
                        }, {} as Record<string, ShoppingItem[]>)
                        const sortedCats = sortAisles(catGroups)

                        return sortedCats.map(catName => {
                            const catItems = catGroups[catName]
                            const cat = CATEGORIES.find(c => c.name === catName)
                            return (
                                <div key={catName} className="space-y-4">
                                    <GroupHeader title={catName} icon={cat?.icon ?? '📦'} />
                                    <div className="space-y-4">
                                        {catItems.map(item => (
                                            <ShoppingItemRow key={item.id} item={item} onMark={markPurchased} onDelete={deleteItem} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    })()
                )}
            </div>

            {/* --- Purchased items (exact fallback layout) --- */}
            {purchasedItems.length > 0 && (
                <div className="pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Purchased (Assign to Storage)</h3>
                        <button
                            onClick={async () => {
                                await Promise.all(purchasedItems.map(i => deleteItem(i.id)))
                            }}
                            className="h-8 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium"
                        >
                            Clear All
                        </button>
                    </div>
                    {purchasedItems.map(item => (
                        <Card key={item.id} className="opacity-60 flex items-center gap-4">
                            <div className="text-2xl">{CATEGORIES.find(c => c.name === item.category)?.icon ?? '📦'}</div>
                            <div className="flex-1">
                                <h4 className="font-bold line-through">{item.name}</h4>
                                <p className="text-xs text-zinc-400">{item.store?.name}</p>
                            </div>
                            <button
                                onClick={() => markPurchased(item)}
                                className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
                            >
                                Undo
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="text-zinc-300 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </Card>
                    ))}
                </div>
            )}
        </main>
    )
}

// --- Shopping item row component (ported from fallback SwipeableItem + Card contents) ---
function ShoppingItemRow({ item, onMark, onDelete }: { item: ShoppingItem; onMark: (i: ShoppingItem) => void; onDelete: (id: string) => void }) {
    const cat = CATEGORIES.find(c => c.name === item.category)
    return (
        <div className="rounded-[20px] tactile-card flex items-center gap-4 p-4">
            <div className="text-2xl">{cat?.icon ?? '📦'}</div>
            <div className="flex-1">
                <h4 className="font-bold">{item.name}</h4>
                <p className="text-xs text-zinc-400">{item.category}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
                    <span className="text-xs font-bold px-2">{item.quantity}</span>
                    <span className="text-[8px] text-zinc-400 uppercase font-bold">{item.unit}</span>
                </div>
                <button
                    onClick={() => onMark(item)}
                    className="h-10 px-3 bg-primary text-white rounded-xl flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                    <CheckCircle2 size={18} />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    )
}

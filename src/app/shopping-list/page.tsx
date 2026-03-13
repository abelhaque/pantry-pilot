'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddItem from '@/components/AddItem'
import { StoreManager } from '@/components/StoreManager'
import { Plus, Search, Mic, MoreVertical, Trash2, ArrowRight, ShoppingCart } from 'lucide-react'

interface ShoppingItem {
    id: string
    name: string
    quantity: number
    unit: string
    category: string
    isPurchased: boolean
}

export default function ShoppingList() {
    const { household, refresh } = useHousehold()
    const router = useRouter()

    const [items, setItems] = useState<ShoppingItem[]>([])
    const [newItemName, setNewItemName] = useState('')
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

    // For assigning purchased items
    const [assigningItem, setAssigningItem] = useState<ShoppingItem | null>(null)
    const [allZones, setAllZones] = useState<{ id: string, name: string }[]>([])

    // Fetch list
    const fetchList = async () => {
        if (!household) return
        const res = await fetch(`/api/shopping-list?householdId=${household.id}`)
        if (res.ok) setItems(await res.json())
    }

    useEffect(() => {
        fetchList()
    }, [household])

    useEffect(() => {
        if (household) {
            const zones = household.locations.flatMap(l =>
                l.zones.map(z => ({ id: z.id, name: `${l.name} - ${z.name}` }))
            )
            setAllZones(zones)
        }
    }, [household])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItemName || !household) return

        // Simple intelligence: infer category for common items
        let category = 'General'
        const lowerName = newItemName.toLowerCase()
        if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt')) category = 'Dairy'
        if (lowerName.includes('bread') || lowerName.includes('bagel') || lowerName.includes('croissant')) category = 'Bakery'
        if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('carrot') || lowerName.includes('fruit') || lowerName.includes('veg')) category = 'Produce'
        if (lowerName.includes('meat') || lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork')) category = 'Meat'

        await fetch('/api/shopping-list', {
            method: 'POST',
            body: JSON.stringify({
                name: newItemName,
                householdId: household.id,
                quantity: 1,
                unit: 'item',
                category,
                storeId: selectedStoreId
            })
        })
        setNewItemName('')
        fetchList()
    }

    const togglePurchased = async (item: ShoppingItem) => {
        await fetch('/api/shopping-list', {
            method: 'PATCH',
            body: JSON.stringify({ id: item.id, isPurchased: !item.isPurchased })
        })
        fetchList()
    }

    const deleteItem = async (id: string) => {
        await fetch(`/api/shopping-list?id=${id}`, { method: 'DELETE' })
        fetchList()
    }

    const handleAssign = async (inventoryItem: any) => {
        if (!assigningItem || !household) return

        await fetch('/api/items', {
            method: 'POST',
            body: JSON.stringify({
                ...inventoryItem,
                householdId: household.id
            })
        })

        await deleteItem(assigningItem.id)
        setAssigningItem(null)
        refresh()
    }

    if (!household) return <div className="p-8 text-center text-[#2C3A2B] font-bold">Loading...</div>

    const filteredItems = selectedStoreId 
        ? items.filter(i => (i as any).storeId === selectedStoreId)
        : items

    const toBuy = filteredItems.filter(i => !i.isPurchased)
    const purchased = filteredItems.filter(i => i.isPurchased)

    // Grouping logic for "Aisle View"
    const groupedItems = toBuy.reduce((acc, item) => {
        const cat = item.category || 'General'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {} as Record<string, ShoppingItem[]>)

    return (
        <main className="container min-h-screen py-8 pb-32">
            <header className="mb-8 p-6 bg-white/20 rounded-3xl backdrop-blur-md border border-white/20">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#2C3A2B]">Shopping List</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C3A2B]/40">LOGISTICS // HOUSEHOLD_ESSENTIALS</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#2C3A2B] flex items-center justify-center text-white font-black active:scale-95 transition-transform cursor-pointer">
                        {toBuy.length}
                    </div>
                </div>

                <form onSubmit={handleAdd} className="relative group">
                    <input
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        placeholder={selectedStoreId ? "Add item to this store..." : "Add item..."}
                        className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/60 border-none text-[#2C3A2B] placeholder-[#2C3A2B]/30 font-bold focus:ring-4 focus:ring-[#2C3A2B]/5 transition-all outline-none"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C3A2B]/30" size={20} />
                    <Mic className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2C3A2B]/30" size={20} />
                </form>
            </header>

            <section className="mb-10">
                <StoreManager 
                    onStoreSelect={setSelectedStoreId}
                    selectedStoreId={selectedStoreId}
                />
            </section>

            {/* To Buy List - Grouped by Aisle */}
            <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, catItems]) => (
                    <section key={category} className="space-y-3">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2C3A2B]/40">{category} // AISLE</h2>
                            <MoreVertical size={16} className="text-[#2C3A2B]/30" />
                        </div>
                        
                        <div className="space-y-3">
                            {catItems.map(item => (
                                <div key={item.id} className="card bg-white/50 border-none p-5 flex items-center gap-4 group active:scale-[0.97] transition-all cursor-pointer">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); togglePurchased(item) }}
                                        className="w-6 h-6 rounded-lg border-2 border-[#2C3A2B]/10 flex items-center justify-center hover:border-[#8DAA81] transition-colors active:scale-90"
                                    >
                                        <div className={`w-3 h-3 rounded-sm ${item.isPurchased ? 'bg-[#8DAA81]' : ''}`} />
                                    </button>
                                    <div className="flex-1">
                                        <div className="font-bold text-[#2C3A2B] leading-tight">{item.name}</div>
                                        <div className="text-[10px] font-medium text-[#2C3A2B]/40 uppercase tracking-widest">{item.quantity} {item.unit}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }} className="p-2 text-[#2C3A2B]/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {toBuy.length === 0 && (
                  <div className="card p-10 bg-white/10 border-dashed border-white/30 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                      <ShoppingCart size={32} />
                    </div>
                    <p className="font-bold text-[#2C3A2B]/40">List is empty</p>
                  </div>
                )}
            </div>

            {/* Purchased List */}
            {purchased.length > 0 && (
                <section>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/40 px-2 mb-4">Completed</h2>
                    <div className="space-y-2">
                        {purchased.map(item => (
                            <div key={item.id} className="card bg-[#2C3A2B]/5 border-none p-4 flex items-center gap-4 opacity-70">
                                <button 
                                  onClick={() => togglePurchased(item)}
                                  className="w-5 h-5 rounded-md bg-[#8DAA81] flex items-center justify-center"
                                >
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </button>
                                <div className="flex-1 line-through font-bold text-[#2C3A2B]/40">{item.name}</div>
                                <button
                                    onClick={() => setAssigningItem(item)}
                                    className="px-4 py-2 bg-[#2C3A2B] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    Unpack <ArrowRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Assign Modal */}
            {assigningItem && (
                <div className="fixed inset-0 bg-[#2C3A2B]/60 backdrop-blur-md z-[100] flex items-end justify-center">
                    <div className="w-full max-w-md bg-white rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500">
                        <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8" />
                        <h3 className="text-2xl font-black text-[#2C3A2B] mb-6">Where to store <span className="text-[#8DAA81]">"{assigningItem.name}"</span>?</h3>
                        <AddItem
                            onAdd={handleAssign}
                            onCancel={() => setAssigningItem(null)}
                            zones={allZones}
                            initialValues={{
                                name: assigningItem.name,
                                quantity: assigningItem.quantity,
                                unit: assigningItem.unit
                            }}
                        />
                    </div>
                </div>
            )}
        </main>
    )
}

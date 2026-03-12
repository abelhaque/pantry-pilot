'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddItem from '@/components/AddItem'

interface ShoppingItem {
    id: string
    name: string
    quantity: number
    unit: string
    isPurchased: boolean
}

export default function ShoppingList() {
    const { household, refresh } = useHousehold()
    const router = useRouter()

    const [items, setItems] = useState<ShoppingItem[]>([])
    const [newItemName, setNewItemName] = useState('')

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

        await fetch('/api/shopping-list', {
            method: 'POST',
            body: JSON.stringify({
                name: newItemName,
                householdId: household.id,
                quantity: 1,
                unit: 'item'
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

        // 1. Create in inventory
        await fetch('/api/items', {
            method: 'POST',
            body: JSON.stringify({
                ...inventoryItem,
                householdId: household.id
            })
        })

        // 2. Remove from shopping list
        await deleteItem(assigningItem.id)

        setAssigningItem(null)
        refresh() // Update household context
    }

    if (!household) return <div>Loading...</div>

    const toBuy = items.filter(i => !i.isPurchased)
    const purchased = items.filter(i => i.isPurchased)

    return (
        <main className="container min-h-screen py-8 pb-32">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <button onClick={() => router.push('/')} className="text-sm text-muted-foreground mb-2">
                        ← Dashboard
                    </button>
                    <h1 className="text-2xl font-bold">Shopping List</h1>
                </div>
                <div className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                    {toBuy.length} items
                </div>
            </header>

            {/* Quick Add */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-8">
                <input
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="Add item..."
                    className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">+</button>
            </form>

            {/* To Buy List */}
            <section className="space-y-2 mb-8">
                {toBuy.length === 0 && <div className="text-center text-muted-foreground py-8">All clear!</div>}
                {toBuy.map(item => (
                    <div key={item.id} className="card flex items-center gap-3 p-3">
                        <input
                            type="checkbox"
                            checked={item.isPurchased}
                            onChange={() => togglePurchased(item)}
                            className="w-5 h-5 accent-primary cursor-pointer"
                        />
                        <div className="flex-1 font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.quantity} {item.unit}</div>
                        <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive">×</button>
                    </div>
                ))}
            </section>

            {/* Purchased List */}
            {purchased.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Purchased</h2>
                    <div className="space-y-2 opacity-80">
                        {purchased.map(item => (
                            <div key={item.id} className="card flex items-center gap-3 p-3 bg-secondary/50">
                                <input
                                    type="checkbox"
                                    checked={item.isPurchased}
                                    onChange={() => togglePurchased(item)}
                                    className="w-5 h-5 accent-primary cursor-pointer"
                                />
                                <div className="flex-1 line-through text-muted-foreground">{item.name}</div>
                                <button
                                    onClick={() => setAssigningItem(item)}
                                    className="btn btn-primary text-xs py-1 px-3 h-auto"
                                >
                                    Assign to Storage
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Assign Modal */}
            {assigningItem && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <div className="bg-card p-4 rounded-t-xl border-b mb-[-1px] relative z-10">
                            <h3 className="font-semibold">Assign "{assigningItem.name}"</h3>
                        </div>
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

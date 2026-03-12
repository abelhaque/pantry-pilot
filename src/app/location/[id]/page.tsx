'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import AddItem from '@/components/AddItem'
import { getCategoryIcon, getExpiryStatus } from '@/utils/categories'
import MoveItemModal from '@/components/MoveItemModal'
import { Item } from '@/types'

export default function LocationReference() {
    const { id } = useParams()
    const router = useRouter()
    const { household, refresh } = useHousehold()

    const [newZoneName, setNewZoneName] = useState('')
    const [isAddingZone, setIsAddingZone] = useState(false)
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [activeZoneId, setActiveZoneId] = useState<string>('')
    const [isMovingItem, setIsMovingItem] = useState<Item | null>(null)

    const location = useMemo(() => {
        return household?.locations.find(l => l.id === id)
    }, [household, id])

    if (!household) return <div>Loading...</div>
    if (!location) return <div>Location not found</div>

    const handleAddZone = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newZoneName) return

        await fetch('/api/zones', {
            method: 'POST',
            body: JSON.stringify({ name: newZoneName, locationId: location.id })
        })

        setNewZoneName('')
        setIsAddingZone(false)
        refresh()
    }

    const handleAddItem = async (itemData: any) => {
        await fetch('/api/items', {
            method: 'POST',
            body: JSON.stringify({
                ...itemData,
                householdId: household.id
            })
        })
        setIsAddingItem(false)
        refresh()
    }

    const openAddItem = (zoneId?: string) => {
        if (zoneId) setActiveZoneId(zoneId)
        setIsAddingItem(true)
    }

    const handleMoveItem = async (itemId: string, newZoneId: string) => {
        await fetch('/api/items', {
            method: 'PATCH',
            body: JSON.stringify({ id: itemId, zoneId: newZoneId })
        })
        setIsMovingItem(null)
        refresh()
    }

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 0) return
        await fetch('/api/items', {
            method: 'PATCH',
            body: JSON.stringify({ id: itemId, quantity: newQuantity })
        })
        refresh()
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return
        await fetch(`/api/items?id=${itemId}`, { method: 'DELETE' })
        refresh()
    }

    return (
        <main className="container min-h-screen py-8 pb-32">
            <header className="mb-6">
                <button onClick={() => router.back()} className="text-sm text-muted-foreground mb-4">
                    ← Back
                </button>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{location.name}</h1>
                    <span className="text-3xl">
                        {location.type === 'fridge' && '❄️'}
                        {location.type === 'freezer' && '🧊'}
                        {location.type === 'pantry' && '🥫'}
                        {location.type === 'other' && '📦'}
                    </span>
                </div>
                <p className="text-muted-foreground capitalize">{location.type}</p>
            </header>

            {isMovingItem && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm">
                        <MoveItemModal
                            item={isMovingItem}
                            locations={household?.locations || []}
                            onMove={handleMoveItem}
                            onCancel={() => setIsMovingItem(null)}
                        />
                    </div>
                </div>
            )}

            {isAddingItem && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <AddItem
                            onAdd={handleAddItem}
                            onCancel={() => setIsAddingItem(false)}
                            zones={location.zones}
                        />
                    </div>
                </div>
            )}

            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Zones</h2>
                    <button onClick={() => setIsAddingZone(!isAddingZone)} className="text-primary text-sm font-medium">
                        {isAddingZone ? 'Cancel' : '+ Add Zone'}
                    </button>
                </div>

                {isAddingZone && (
                    <form onSubmit={handleAddZone} className="card mb-4 flex gap-2">
                        <input
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="Zone Name (e.g. Cheese Drawer)"
                            className="input flex-1"
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Save</button>
                    </form>
                )}

                <div className="space-y-4">
                    {location.zones.map(zone => (
                        <div key={zone.id} className="card">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">{zone.name}</h3>
                                <span className="text-xs text-muted-foreground">{zone.items.length} items</span>
                            </div>

                            {zone.items.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded opacity-50">
                                    Empty
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {zone.items.map(item => (
                                        <li key={item.id} className="text-sm border-b py-2 last:border-0 flex justify-between items-center group/item pl-1 pr-1 hover:bg-muted/30 rounded transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{getCategoryIcon(item.category)}</span>
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    {item.expiry && (
                                                        <div className={`text-[10px] uppercase font-bold tracking-wider ${getExpiryStatus(item.expiry) === 'expired' ? 'text-destructive' :
                                                            getExpiryStatus(item.expiry) === 'warning' ? 'text-status-warning' :
                                                                'text-status-good'
                                                            }`}>
                                                            {getExpiryStatus(item.expiry)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 bg-secondary rounded px-1">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        className="w-6 h-6 flex items-center justify-center hover:bg-background rounded"
                                                        disabled={item.quantity <= 0}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-mono text-xs w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="w-6 h-6 flex items-center justify-center hover:bg-background rounded"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-xs text-muted-foreground w-8">{item.unit}</span>

                                                {/* Action Buttons */}
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setIsMovingItem(item)}
                                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded"
                                                        title="Move"
                                                    >
                                                        ↪️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-2 text-right">
                                <button onClick={() => openAddItem(zone.id)} className="text-xs text-primary font-medium p-2 hover:bg-secondary rounded">+ Add Item</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto">
                <button onClick={() => openAddItem()} className="btn btn-primary w-full shadow-lg text-lg py-4">
                    + Add Item to {location.name}
                </button>
            </div>

        </main>
    )
}

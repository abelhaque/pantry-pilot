'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
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
            <header className="mb-8 px-2">
                <button 
                  onClick={() => router.push('/')} 
                  className="text-[10px] font-black uppercase tracking-widest text-[#2C3A2B]/40 mb-6 flex items-center gap-2 hover:text-[#2C3A2B] transition-colors"
                >
                    <LucideIcons.ArrowLeft size={14} /> Back to Dashboard
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-[#2C3A2B] mb-1">{location.name}</h1>
                        <p className="text-[10px] font-bold text-[#2C3A2B]/40 uppercase tracking-widest">{location.type} Management</p>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-white/40 flex items-center justify-center text-4xl shadow-sm backdrop-blur-sm">
                        {location.type === 'fridge' ? '❄️' : location.type === 'freezer' ? '🧊' : '📦'}
                    </div>
                </div>
            </header>

            {isMovingItem && (
                <div className="fixed inset-0 bg-[#2C3A2B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
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
                <div className="fixed inset-0 bg-[#2C3A2B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <AddItem
                            onAdd={handleAddItem}
                            onCancel={() => setIsAddingItem(false)}
                            zones={location.zones}
                        />
                    </div>
                </div>
            )}

            <section className="mb-12 px-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/40">Storage Zones</h2>
                    <button 
                      onClick={() => setIsAddingZone(!isAddingZone)} 
                      className="text-[#2C3A2B] text-xs font-bold hover:underline"
                    >
                        {isAddingZone ? 'Cancel' : '+ Add Zone'}
                    </button>
                </div>

                {isAddingZone && (
                    <form onSubmit={handleAddZone} className="card mb-6 p-6 bg-white/60 border-none backdrop-blur-md animate-in slide-in-from-top-4 flex gap-3">
                        <input
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            placeholder="e.g. Upper Shelf"
                            className="flex-1 h-12 px-5 rounded-xl bg-white/50 border-none text-[#2C3A2B] font-bold outline-none"
                            autoFocus
                        />
                        <button type="submit" className="h-12 px-6 bg-[#2C3A2B] text-white font-black rounded-xl text-xs uppercase tracking-widest">Add</button>
                    </form>
                )}

                <div className="space-y-6">
                    {location.zones.map(zone => (
                        <div key={zone.id} className="card bg-white/40 border-none p-0 overflow-hidden">
                            <div className="p-5 flex justify-between items-center bg-white/20 border-b border-black/5">
                                <h3 className="font-black text-xs uppercase tracking-widest text-[#2C3A2B]">{zone.name}</h3>
                                <div className="px-3 py-1 rounded-full bg-[#2C3A2B]/5 text-[9px] font-black uppercase tracking-tighter text-[#2C3A2B]/40">
                                  {zone.items.length} items
                                </div>
                            </div>

                            {zone.items.length === 0 ? (
                                <div className="p-8 text-center bg-white/10 border-dashed border-black/5 m-4 rounded-2xl">
                                    <p className="text-[10px] font-bold text-[#2C3A2B]/20 uppercase tracking-widest">No items in this zone</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-black/5">
                                    {zone.items.map(item => (
                                        <li key={item.id} className="p-5 flex justify-between items-center hover:bg-white/20 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-xl">
                                                    {getCategoryIcon(item.category)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#2C3A2B]">{item.name}</div>
                                                    {item.expiry && (
                                                        <div className={`text-[9px] uppercase font-black tracking-widest mt-0.5 ${
                                                          getExpiryStatus(item.expiry) === 'expired' ? 'text-red-500' :
                                                          getExpiryStatus(item.expiry) === 'warning' ? 'text-orange-500' :
                                                          'text-[#8DAA81]'
                                                        }`}>
                                                            {getExpiryStatus(item.expiry)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 bg-white/50 rounded-xl p-1 shadow-sm">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-[#2C3A2B]"
                                                        disabled={item.quantity <= 0}
                                                    >
                                                        <LucideIcons.Minus size={14} strokeWidth={3} />
                                                    </button>
                                                    <span className="font-black text-xs w-8 text-center text-[#2C3A2B]">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-[#2C3A2B]"
                                                    >
                                                        <LucideIcons.Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                                
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setIsMovingItem(item)}
                                                        className="p-2 text-[#2C3A2B]/20 hover:text-[#2C3A2B] transition-colors"
                                                    >
                                                        <LucideIcons.Move size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-2 text-[#2C3A2B]/20 hover:text-red-500 transition-colors"
                                                    >
                                                        <LucideIcons.Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="p-3 bg-white/20 text-center">
                                <button 
                                  onClick={() => openAddItem(zone.id)} 
                                  className="text-[10px] font-black uppercase tracking-widest text-[#2C3A2B]/40 hover:text-[#2C3A2B] transition-colors"
                                >
                                  + Quick Add Item
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="fixed bottom-32 left-8 right-8 max-w-lg mx-auto z-40">
                <button 
                  onClick={() => openAddItem()} 
                  className="w-full h-16 bg-[#2C3A2B] text-white font-black rounded-3xl shadow-2xl shadow-[#2C3A2B]/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <LucideIcons.Plus size={20} strokeWidth={3} />
                    <span className="uppercase tracking-widest text-sm text-[16px]">Add to {location.name}</span>
                </button>
            </div>
        </main>
    )
}

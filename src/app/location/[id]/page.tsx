'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import AddItem from '@/components/AddItem'
import { getCategoryIcon, getExpiryStatus } from '@/utils/categories'
import MoveItemModal from '@/components/MoveItemModal'
import { Item, CATEGORIES } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

export default function LocationReference() {
    const { id } = useParams()
    const router = useRouter()
    const { household, refresh } = useHousehold()

    const [activeZoneFilter, setActiveZoneFilter] = useState<string>('all')
    const [isAddingItem, setIsAddingItem] = useState(false)
    const [isMovingItem, setIsMovingItem] = useState<Item | null>(null)

    const location = useMemo(() => {
        return household?.locations?.find(l => l.id === id)
    }, [household, id])

    // --- Data Calculations ---
    const allItems = useMemo(() => {
        if (!location) return []
        let items = (location.zones || []).flatMap(z => (z.items || []).map(i => ({ ...i, zoneName: z.name, zoneId: z.id })))
        if (activeZoneFilter !== 'all') {
            items = items.filter(i => i.zoneId === activeZoneFilter)
        }
        return items
    }, [location, activeZoneFilter])

    // Aisle Grouping logic
    const aisleGroups = useMemo(() => {
        const groups = allItems.reduce((acc, item) => {
            const cat = item.shoppingCategory || 'Other'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(item)
            return acc
        }, {} as Record<string, typeof allItems>)

        // Sort aisles based on CATEGORIES order
        return Object.keys(groups).sort((a, b) => {
            const order = CATEGORIES.map(c => c.name)
            const indexA = order.indexOf(a as any)
            const indexB = order.indexOf(b as any)
            if (indexA === -1 && indexB === -1) return a.localeCompare(b)
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
        }).map(name => ({
            name,
            items: groups[name],
            icon: CATEGORIES.find(c => c.name === name)?.icon || '📦'
        }))
    }, [allItems])

    if (!household) return (
        <div className="min-h-screen bg-[#1A2119] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
    if (!location) return (
        <div className="min-h-screen bg-[#1A2119] flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Location Not Found</h1>
            <button onClick={() => router.push('/')} className="px-8 py-4 bg-emerald-500 text-[#1A2119] font-black rounded-3xl uppercase tracking-widest text-xs">Back to Dashboard</button>
        </div>
    )

    const handleAddItem = async (itemData: any) => {
        await fetch('/api/items', {
            method: 'POST',
            body: JSON.stringify({ ...itemData, householdId: household.id })
        })
        setIsAddingItem(false)
        refresh()
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
        <main className="min-h-screen bg-[#F9F7F2] pb-40">
            {/* Header Overhaul */}
            <header className="bg-[#1A2119] text-white pt-16 pb-12 px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <button 
                        onClick={() => router.push('/')} 
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-10 flex items-center gap-2 hover:text-emerald-400 transition-colors"
                    >
                        <LucideIcons.ArrowLeft size={16} /> Dashboard
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <p className="text-emerald-500/60 font-black text-[10px] uppercase tracking-[0.3em]">{location.type} MANAGEMENT</p>
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">{location.name}</h1>
                        </div>
                        <div className="w-24 h-24 rounded-[36px] bg-white/5 border border-white/10 flex items-center justify-center text-5xl shadow-2xl backdrop-blur-md">
                            {location.name.toLowerCase().includes('fridge') ? <LucideIcons.Refrigerator size={44} /> : 
                             location.name.toLowerCase().includes('freezer') ? <LucideIcons.Snowflake size={44} /> : 
                             <LucideIcons.Archive size={44} />}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
                {/* Zone Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
                    <button 
                        onClick={() => setActiveZoneFilter('all')}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-xl ${activeZoneFilter === 'all' ? 'bg-[#1A2119] text-white' : 'bg-white text-[#1A2119]/40 hover:bg-[#1A2119]/5'}`}
                    >
                        All Zones
                    </button>
                    {location.zones?.map(zone => (
                        <button 
                            key={zone.id}
                            onClick={() => setActiveZoneFilter(zone.id)}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-xl ${activeZoneFilter === zone.id ? 'bg-[#1A2119] text-white' : 'bg-white text-[#1A2119]/40 hover:bg-[#1A2119]/5'}`}
                        >
                            {zone.name}
                        </button>
                    ))}
                </div>

                {/* Inventory List (Aisle Grouped) */}
                <div className="space-y-12">
                    {aisleGroups.length > 0 ? aisleGroups.map((group) => (
                        <div key={group.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-2xl">{group.icon}</div>
                                <div>
                                    <h3 className="font-black text-lg text-[#1A2119] tracking-tight">{group.name}</h3>
                                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">{group.items.length} Items</p>
                                </div>
                                <div className="h-[2px] flex-1 bg-[#1A2119]/5 ml-4 rounded-full"></div>
                            </div>

                            <div className="bg-white rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-[#1A2119]/5 overflow-hidden">
                                <ul className="divide-y divide-[#1A2119]/5">
                                    {group.items.map((item: any) => (
                                        <li key={item.id} className="p-6 flex items-center justify-between hover:bg-[#F9F7F2]/50 transition-colors group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-[#F9F7F2] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                                    {getCategoryIcon(item.category)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl text-[#1A2119] tracking-tight">{item.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-[#1A2119]/30 uppercase tracking-widest">{item.zoneName}</span>
                                                        {item.expiry && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-[#1A2119]/10"></span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                                    getExpiryStatus(item.expiry) === 'expired' ? 'text-rose-500' :
                                                                    getExpiryStatus(item.expiry) === 'warning' ? 'text-amber-500' :
                                                                    'text-emerald-600'
                                                                }`}>
                                                                    {getExpiryStatus(item.expiry)}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center bg-[#F9F7F2] rounded-2xl p-1.5 border border-[#1A2119]/5 shadow-inner">
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all active:scale-90 text-[#1A2119]"
                                                    >
                                                        <LucideIcons.Minus size={18} strokeWidth={3} />
                                                    </button>
                                                    <span className="text-xl font-black w-12 text-center text-[#1A2119] tabular-nums">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all active:scale-90 text-[#1A2119]"
                                                    >
                                                        <LucideIcons.Plus size={18} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button onClick={() => setIsMovingItem(item)} className="w-12 h-12 flex items-center justify-center bg-white border border-[#1A2119]/5 rounded-2xl text-[#1A2119]/20 hover:text-[#1A2119] hover:shadow-lg transition-all active:scale-90">
                                                        <LucideIcons.Move size={20} />
                                                    </button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="w-12 h-12 flex items-center justify-center bg-white border border-[#1A2119]/5 rounded-2xl text-[#1A2119]/20 hover:text-rose-500 hover:shadow-lg transition-all active:scale-90">
                                                        <LucideIcons.Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )) : (
                        <div className="py-32 text-center animate-in fade-in zoom-in duration-700">
                           <div className="w-32 h-32 bg-[#1A2119] rounded-[48px] flex items-center justify-center text-white/10 mx-auto mb-8 shadow-2xl">
                               <LucideIcons.Search size={64} />
                           </div>
                           <h3 className="text-3xl font-black text-[#1A2119] mb-3 uppercase tracking-tighter">No items found</h3>
                           <p className="text-[11px] font-black text-[#1A2119]/30 uppercase tracking-[0.4em]">Try clearing your zone filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Actions */}
            <div className="fixed bottom-12 left-0 right-0 z-50 px-8">
                <div className="max-w-lg mx-auto">
                    <button 
                        onClick={() => setIsAddingItem(true)}
                        className="w-full h-20 bg-[#1A2119] text-white rounded-[32px] font-black uppercase tracking-[0.4em] text-sm shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                    >
                        <LucideIcons.Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        Add item to {location.name}
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isMovingItem && (
                    <div className="fixed inset-0 bg-[#1A2119]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
                            <MoveItemModal item={isMovingItem} locations={household?.locations || []} onMove={handleMoveItem} onCancel={() => setIsMovingItem(null)} />
                        </motion.div>
                    </div>
                )}
                {isAddingItem && (
                    <div className="fixed inset-0 bg-[#1A2119]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg">
                            <AddItem onAdd={handleAddItem} onCancel={() => setIsAddingItem(false)} zones={location.zones} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}

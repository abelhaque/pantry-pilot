'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  AlertTriangle, 
  Activity, 
  Package, 
  Plus, 
  X
} from 'lucide-react'
import { CATEGORIES, OFFICIAL_ICONS } from '@/types'

// --- Unified Storage Card Component ---
const StorageCard = ({ 
    loc, 
    idx, 
    onAddZone, 
    onClick 
}: { 
    loc: any, 
    idx: number, 
    onAddZone: (id: string) => void,
    onClick: (id: string) => void 
}) => {
    const count = loc.zones?.reduce((acc: number, z: any) => acc + (z.items?.length || 0), 0) || 0
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="relative group"
        >
            <button
                onClick={() => onClick(loc.id)}
                className="w-full text-left relative overflow-hidden rounded-[44px] p-8 transition-all bg-gradient-to-br from-[#2C3A2B] to-[#1A2119] border border-white/10 shadow-2xl min-h-[260px] flex flex-col justify-between group-hover:translate-y-[-8px] group-hover:shadow-[0_45px_90px_rgba(0,0,0,0.3)] duration-500"
            >
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                
                <div className="text-6xl group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700 origin-left">
                    {loc.icon || '📦'}
                </div>
                
                <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight leading-none mb-4 group-hover:translate-x-1 transition-transform">
                        {loc.name}
                    </h3>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse"></span>
                        <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em]">
                            {count} Items
                        </span>
                    </div>
                </div>
            </button>

            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                    e.stopPropagation()
                    onAddZone(loc.id)
                }}
                className="absolute top-8 right-8 w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
            >
                <Plus size={24} />
            </motion.button>
        </motion.div>
    )
}

export default function Page() {
    const router = useRouter()
    const { household, isLoading, createLocation, createZone } = useHousehold()
    
    // --- UI State ---
    const [isAddingLocation, setIsAddingLocation] = useState(false)
    const [isAddingZone, setIsAddingZone] = useState(false)
    const [selectedLocForZone, setSelectedLocForZone] = useState<string | null>(null)
    const [newLocName, setNewLocName] = useState('')
    const [newLocIcon, setNewLocIcon] = useState('📦')
    const [newZoneName, setNewZoneName] = useState('')

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1A2119] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    // --- Data Calculations ---
    const allItems = household?.locations?.flatMap(l => l.zones.flatMap(z => z.items || [])) || []
    const totalItemsCount = allItems.length
    
    const shoppingList = (household as any)?.shoppingList || []
    const toBuyCount = shoppingList.filter((i: any) => !i.isPurchased).length

    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(new Date().getDate() + 3)
    
    const expiringSoonCount = allItems.filter(item => {
        const expiry = item.expiry_date || item.expiry
        if (!expiry) return false
        return new Date(expiry) <= threeDaysFromNow
    }).length

    const lowStockCount = allItems.filter(item => item.quantity <= (item.low_stock_threshold || 1)).length

    const shoppingBags = household?.locations?.find(l => l.name.toLowerCase().includes('shopping bags'))
    const shoppingBagsItems = shoppingBags?.zones?.flatMap(z => z.items || []) || []
    
    // Group by Aisle (Category)
    const aisleGroups = shoppingBagsItems.reduce((acc, item) => {
        const cat = item.shoppingCategory || 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {} as Record<string, typeof shoppingBagsItems>)

    const sortedAisles = Object.keys(aisleGroups).sort((a, b) => {
        const order = CATEGORIES.map(c => c.name)
        const indexA = order.indexOf(a as any)
        const indexB = order.indexOf(b as any)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
    }).map(name => {
        const category = CATEGORIES.find(c => c.name === name)
        return {
            name,
            icon: category?.icon || '📦',
            count: aisleGroups[name].length
        }
    })

    // Filter locations for the grid: All except "Shopping Bags"
    const gridLocations = household?.locations?.filter(l => !l.name.toLowerCase().includes('shopping bags')) || []

    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newLocName.trim()) {
            await createLocation(newLocName, newLocIcon, 'storage')
            setIsAddingLocation(false)
            setNewLocName('')
            setNewLocIcon('📦')
        }
    }

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newZoneName.trim() && selectedLocForZone) {
            await createZone(newZoneName, selectedLocForZone)
            setIsAddingZone(false)
            setNewZoneName('')
            setSelectedLocForZone(null)
        }
    }

    return (
        <main className="min-h-screen bg-[#F9F7F2] pb-24">
            <div className="max-w-5xl mx-auto px-6 pt-12">
                {/* Header */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-4xl font-bold text-[#1A2119] tracking-tight mb-2">Pantry Pilot</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <p className="text-[#2C3A2B]/60 font-bold text-xs uppercase tracking-[0.2em]">{household?.name || 'Household Dashboard'}</p>
                        </div>
                    </motion.div>

                    {/* Tablet Buttons */}
                    <div className="flex gap-3">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 rounded-full bg-white border border-[#1A2119]/5 shadow-sm flex items-center gap-2.5 group transition-all hover:border-amber-500/30 hover:shadow-amber-100/20"
                        >
                            <AlertTriangle size={15} className="text-amber-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A2119]/60 group-hover:text-amber-600">
                                {expiringSoonCount} Expiring
                            </span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 rounded-full bg-white border border-[#1A2119]/5 shadow-sm flex items-center gap-2.5 group transition-all hover:border-rose-500/30 hover:shadow-rose-100/20"
                        >
                            <Activity size={15} className="text-rose-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A2119]/60 group-hover:text-rose-600">
                                {lowStockCount} Low Stock
                            </span>
                        </motion.button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-[40px] p-8 bg-white border border-[#1A2119]/5 shadow-[0_25px_50px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[200px]"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.04] text-[#1A2119]">
                            <Package size={100} />
                        </div>
                        <div>
                            <p className="text-[#1A2119]/40 font-bold text-[11px] uppercase tracking-[0.25em] mb-2">Inventory Total</p>
                            <h2 className="text-6xl font-black text-[#1A2119] tabular-nums tracking-tighter">
                                {totalItemsCount}
                            </h2>
                        </div>
                        <p className="text-[#1A2119]/30 text-xs font-semibold">Active items across all locations</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -6, boxShadow: "0 40px 80px rgba(0,0,0,0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/shopping-list')}
                        className="relative overflow-hidden rounded-[40px] p-8 bg-[#1A2119] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[200px] text-left group"
                    >
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 blur-[60px] group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                        <div>
                            <p className="text-white/40 font-bold text-[11px] uppercase tracking-[0.25em] mb-2">To Buy List</p>
                            <h2 className="text-6xl font-black text-white tabular-nums tracking-tighter">
                                {toBuyCount}
                            </h2>
                        </div>
                        <div className="flex items-center justify-between text-white/50 text-[11px] font-bold uppercase tracking-widest">
                            <span>Manage List</span>
                            <ChevronRight size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>

                {/* Shopping Bags Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                >
                    <button 
                        onClick={() => shoppingBags && router.push(`/location/${shoppingBags.id}`)}
                        className="w-full p-8 rounded-[44px] bg-white border border-[#1A2119]/5 shadow-[0_30px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_45px_90px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden text-left"
                    >
                        <div className="flex flex-col gap-10 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[30px] bg-[#1A2119]/5 border border-[#1A2119]/10 flex items-center justify-center text-4xl group-hover:bg-[#1A2119] group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6">
                                        🛍️
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-3xl text-[#1A2119] mb-1.5 tracking-tight group-hover:translate-x-1 transition-transform">
                                            Shopping Bags
                                        </h4>
                                        <p className="text-emerald-600/60 font-black text-[11px] uppercase tracking-[0.25em]">
                                            {shoppingBagsItems.length} items to sort
                                        </p>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-[20px] bg-[#1A2119]/5 border border-[#1A2119]/10 flex items-center justify-center text-[#1A2119]/30 group-hover:bg-[#1A2119] group-hover:text-white transition-all shadow-md group-hover:scale-110">
                                    <ChevronRight size={28} />
                                </div>
                            </div>

                            {/* Aisle Grouping */}
                            <div className="flex flex-wrap gap-3">
                                {sortedAisles.length > 0 ? sortedAisles.map((aisle) => (
                                    <div 
                                        key={aisle.name}
                                        className="px-5 py-3 rounded-2xl bg-[#1A2119]/[0.03] border border-[#1A2119]/5 flex items-center gap-3 hover:bg-white hover:shadow-xl hover:scale-105 transition-all cursor-default"
                                    >
                                        <span className="text-xl">{aisle.icon}</span>
                                        <span className="text-[#1A2119] text-xs font-bold">{aisle.name}</span>
                                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{aisle.count}</span>
                                    </div>
                                )) : (
                                    <p className="text-[#1A2119]/20 text-[11px] font-bold uppercase tracking-widest italic py-2">
                                        All items put away
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                </motion.div>

                {/* Storage Grid */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    {gridLocations.map((loc, idx) => (
                        <StorageCard 
                            key={loc.id} 
                            loc={loc} 
                            idx={idx} 
                            onAddZone={(id) => {
                                setSelectedLocForZone(id)
                                setIsAddingZone(true)
                            }}
                            onClick={(id) => router.push(`/location/${id}`)}
                        />
                    ))}

                    {/* Add Storage Unit Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + gridLocations.length * 0.05 }}
                        whileHover={{ y: -8, boxShadow: "0 45px 90px rgba(0,0,0,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAddingLocation(true)}
                        className="rounded-[44px] p-8 border-4 border-dashed border-[#1A2119]/5 bg-white/50 flex flex-col items-center justify-center gap-4 group transition-all min-h-[260px] hover:bg-white hover:border-emerald-500/20"
                    >
                        <div className="w-16 h-16 rounded-[24px] bg-[#1A2119]/5 flex items-center justify-center text-[#1A2119]/20 group-hover:bg-[#1A2119] group-hover:text-white transition-all shadow-inner group-hover:rotate-90">
                            <Plus size={32} />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A2119]/30 group-hover:text-[#1A2119]">
                            Add Storage Unit
                        </span>
                    </motion.button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isAddingLocation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A2119]/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative"
                        >
                            <button onClick={() => setIsAddingLocation(false)} className="absolute top-10 right-10 p-2 text-[#1A2119]/20 hover:text-[#1A2119] transition-colors">
                                <X size={24} />
                            </button>
                            
                            <h3 className="text-3xl font-black text-[#1A2119] mb-10 tracking-tight">New Storage Unit</h3>
                            
                            <form onSubmit={handleCreateLocation} className="space-y-10">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A2119]/30 mb-4 block">Unit Name</label>
                                    <input 
                                        autoFocus
                                        required
                                        value={newLocName}
                                        onChange={(e) => setNewLocName(e.target.value)}
                                        placeholder="e.g. Wine Chiller"
                                        className="w-full bg-[#1A2119]/[0.03] border-2 border-transparent focus:border-emerald-500/30 rounded-3xl px-8 py-5 text-lg font-bold text-[#1A2119] outline-none transition-all placeholder:text-[#1A2119]/10"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A2119]/30 mb-6 block">Select Icon</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {OFFICIAL_ICONS.map((item) => (
                                            <button
                                                key={item.icon}
                                                type="button"
                                                onClick={() => setNewLocIcon(item.icon)}
                                                className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all ${
                                                    newLocIcon === item.icon 
                                                    ? 'bg-[#1A2119] text-white shadow-xl scale-110 shadow-emerald-500/20' 
                                                    : 'bg-[#1A2119]/[0.03] text-[#1A2119]/40 hover:bg-[#1A2119]/[0.08]'
                                                }`}
                                            >
                                                {item.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-[#1A2119] text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-[#1A2119]/20 hover:bg-emerald-600 transition-all text-[12px]"
                                >
                                    Create Storage Unit
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isAddingZone && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A2119]/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[44px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative"
                        >
                            <button onClick={() => setIsAddingZone(false)} className="absolute top-8 right-8 p-2 text-[#1A2119]/20 hover:text-[#1A2119] transition-colors">
                                <X size={20} />
                            </button>
                            
                            <h3 className="text-2xl font-black text-[#1A2119] mb-8 tracking-tight">Add Storage Zone</h3>
                            
                            <form onSubmit={handleCreateZone} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A2119]/30 mb-4 block">Zone Name</label>
                                    <input 
                                        autoFocus
                                        required
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        placeholder="e.g. Bottom Drawer"
                                        className="w-full bg-[#1A2119]/[0.03] border-2 border-transparent focus:border-emerald-500/30 rounded-2xl px-6 py-4 text-md font-bold text-[#1A2119] outline-none transition-all"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-[#1A2119] text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all text-[11px]"
                                >
                                    Create Zone
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}

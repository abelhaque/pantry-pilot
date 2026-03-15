'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ChevronRight, 
  AlertTriangle, 
  Activity, 
  Package, 
  Plus, 
  X,
  Warehouse,
  ClipboardList,
  Refrigerator,
  Snowflake,
  Archive,
  MoreHorizontal
} from 'lucide-react'
import { CATEGORIES } from '@/types'

// --- Core Units Configuration ---
const CORE_UNITS_CONFIG = [
    { name: 'Fridge', icon: Refrigerator },
    { name: 'Freezer', icon: Snowflake },
    { name: 'Cupboard', icon: Archive },
    { name: 'Other', icon: MoreHorizontal }
]

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
    const count = (loc.zones || []).reduce((acc: number, z: any) => acc + (z.items?.length || 0), 0) || 0
    const IconComponent = typeof loc.icon === 'function' ? loc.icon : null
    const isPlaceholder = loc.id && typeof loc.id === 'string' && loc.id.startsWith('temp-')

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="relative group h-full"
        >
            <div
                onClick={() => !isPlaceholder && onClick(loc.id)}
                className={`w-full text-left relative overflow-hidden rounded-[44px] p-8 transition-all bg-gradient-to-br from-[#2C3A2B] to-[#1A2119] border border-white/10 shadow-2xl min-h-[260px] flex flex-col justify-between group-hover:translate-y-[-8px] group-hover:shadow-[0_45px_90px_rgba(0,0,0,0.3)] duration-500 ${isPlaceholder ? 'opacity-50 grayscale cursor-default' : 'cursor-pointer'}`}
            >
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                
                <div className="text-6xl group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700 origin-left text-white/90">
                    {IconComponent ? <IconComponent size={64} strokeWidth={1.5} /> : (loc.icon || '📦')}
                </div>
                
                <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight leading-none mb-4 group-hover:translate-x-1 transition-transform">
                        {loc.name}
                    </h3>
                    <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${(count || 0) > 0 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]' : 'bg-white/10'} animate-pulse`}></span>
                        <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em]">
                            {count || 0} Items
                        </span>
                    </div>
                </div>
            </div>

            {!isPlaceholder && (
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "#10b981" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddZone(loc.id)
                    }}
                    className="absolute top-8 right-8 w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all shadow-xl backdrop-blur-sm z-20 group-hover:opacity-100 opacity-0 md:opacity-0 translate-y-2 group-hover:translate-y-0 duration-300"
                >
                    <Plus size={24} />
                </motion.button>
            )}
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
    const allItems = household?.locations?.flatMap(l => (l.zones || []).flatMap(z => z.items || [])) || []
    const totalItemsCount = allItems.length
    
    const shoppingList = (household as any)?.shoppingList || []
    const toBuyCount = (shoppingList?.filter((i: any) => !i.isPurchased) || []).length

    // Use static value for initial render to avoid hydration mismatch, or better: defer calculation
    const [hydrated, setHydrated] = useState(false)
    useEffect(() => { setHydrated(true) }, [])

    const expiringSoonCount = hydrated ? allItems.filter(item => {
        const expiry = item.expiry_date || item.expiry
        if (!expiry) return false
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(new Date().getDate() + 3)
        return new Date(expiry) <= threeDaysFromNow
    }).length : 0

    const lowStockCount = allItems.filter(item => item.quantity <= (item.low_stock_threshold || 1)).length

    const shoppingBags = household?.locations?.find(l => l.name?.toLowerCase().includes('shopping bags'))
    const shoppingBagsItems = shoppingBags?.zones?.flatMap(z => z.items || []) || []
    
    // Group by Aisle (Category)
    const aisleGroups = (shoppingBagsItems || []).reduce((acc, item) => {
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

    // --- Core Grid Initialization ---
    const coreGrid = CORE_UNITS_CONFIG.map(config => {
        const existing = household?.locations?.find(l => l.name?.toLowerCase() === config.name?.toLowerCase())
        if (existing) {
            return { ...existing, icon: config.icon }
        }
        return { id: 'temp-' + config.name, name: config.name, icon: config.icon, zones: [] }
    })

    const customLocations = household?.locations?.filter(l => 
        l.name && 
        !l.name.toLowerCase().includes('shopping bags') &&
        !CORE_UNITS_CONFIG.some(c => c.name?.toLowerCase() === l.name?.toLowerCase())
    ) || []

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
        <main className="min-h-screen bg-[#F9F7F2] pb-32">
            <div className="max-w-5xl mx-auto px-6 pt-12">
                {/* Header */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-4xl font-black text-[#1A2119] tracking-tight mb-2 uppercase">Pantry Pilot</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <p className="text-[#2C3A2B]/60 font-bold text-[10px] uppercase tracking-[0.3em]">{household?.name || 'Household Dashboard'}</p>
                        </div>
                    </motion.div>

                    <div className="flex gap-3">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 rounded-full bg-white border border-[#1A2119]/5 shadow-sm flex items-center gap-2.5 group hover:border-amber-500/30 transition-all font-bold text-[10px] uppercase tracking-widest text-[#1A2119]/40"
                        >
                            <AlertTriangle size={14} className="text-amber-500" />
                            <span>{expiringSoonCount} Expiring</span>
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 rounded-full bg-white border border-[#1A2119]/5 shadow-sm flex items-center gap-2.5 group hover:border-rose-500/30 transition-all font-bold text-[10px] uppercase tracking-widest text-[#1A2119]/40"
                        >
                            <Activity size={14} className="text-rose-500" />
                            <span>{lowStockCount} Low Stock</span>
                        </motion.button>
                    </div>
                </div>

                {/* Summary Cards - FORCED SIDE-BY-SIDE */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-[44px] p-10 bg-white border border-[#1A2119]/5 shadow-[0_30px_60px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[240px]"
                    >
                        <div className="absolute top-10 right-10 text-[#1A2119] opacity-[0.08]">
                            <Warehouse size={48} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[#1A2119]/30 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Inventory Total</p>
                            <h2 className="text-7xl font-black text-[#1A2119] tabular-nums tracking-tighter leading-none">
                                {totalItemsCount}
                            </h2>
                        </div>
                        <p className="text-[#1A2119]/20 text-[10px] font-black uppercase tracking-widest italic">Across all units</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8, boxShadow: "0 50px 100px rgba(0,0,0,0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/shopping-list')}
                        className="relative overflow-hidden rounded-[44px] p-10 bg-[#1A2119] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[240px] text-left group"
                    >
                        <div className="absolute top-10 right-10 text-emerald-500">
                            <ClipboardList size={48} strokeWidth={2.5} />
                        </div>
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                        <div>
                            <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em] mb-4">To Buy List</p>
                            <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none">
                                {toBuyCount}
                            </h2>
                        </div>
                        <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                            <span>Manage List</span>
                            <ChevronRight size={20} className="text-emerald-500 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.button>
                </div>

                {/* Shopping Bags Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-14"
                >
                    <button 
                        onClick={() => shoppingBags && router.push(`/location/${shoppingBags.id}`)}
                        className="w-full p-10 rounded-[50px] bg-white border border-[#1A2119]/5 shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:shadow-[0_60px_120px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden text-left"
                    >
                        <div className="flex flex-col gap-10 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-10">
                                    <div className="w-24 h-24 rounded-[36px] bg-[#1A2119]/5 border border-[#1A2119]/10 flex items-center justify-center text-5xl group-hover:bg-[#1A2119] group-hover:text-white transition-all duration-700 shadow-inner group-hover:rotate-6">
                                        🛍️
                                    </div>
                                    <div>
                                        <h4 className="font-black text-4xl text-[#1A2119] mb-2 tracking-tight">
                                            Shopping Bags
                                        </h4>
                                        <p className="text-emerald-600/60 font-black text-[11px] uppercase tracking-[0.4em]">
                                            {shoppingBagsItems.length} items to sort
                                        </p>
                                    </div>
                                </div>
                                <div className="w-16 h-16 rounded-full bg-[#1A2119]/5 flex items-center justify-center text-[#1A2119]/20 group-hover:bg-[#1A2119] group-hover:text-white transition-all group-hover:scale-110">
                                    <ChevronRight size={32} />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {sortedAisles.length > 0 ? sortedAisles.map((aisle) => (
                                    <div 
                                        key={aisle.name}
                                        className="px-6 py-4 rounded-2xl bg-[#1A2119]/[0.03] border border-[#1A2119]/5 flex items-center gap-4 hover:bg-white hover:shadow-xl hover:scale-105 transition-all"
                                    >
                                        <span className="text-2xl">{aisle.icon}</span>
                                        <span className="text-[#1A2119] text-xs font-black uppercase tracking-widest">{aisle.name}</span>
                                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{aisle.count}</span>
                                    </div>
                                )) : (
                                    <p className="text-[#1A2119]/20 text-[11px] font-black uppercase tracking-[0.5em] italic py-4">
                                        All inventory sorted
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                </motion.div>

                {/* Core Storage Grid */}
                <div className="grid grid-cols-2 gap-8 mb-14">
                    {coreGrid.map((loc, idx) => (
                        <StorageCard 
                            key={loc.name} 
                            loc={loc} 
                            idx={idx} 
                            onAddZone={(id) => {
                                setSelectedLocForZone(id)
                                setIsAddingZone(true)
                            }}
                            onClick={(id) => router.push(`/location/${id}`)}
                        />
                    ))}

                    {customLocations.map((loc, idx) => (
                        <StorageCard 
                            key={loc.id} 
                            loc={loc} 
                            idx={idx + 4} 
                            onAddZone={(id) => {
                                setSelectedLocForZone(id)
                                setIsAddingZone(true)
                            }}
                            onClick={(id) => router.push(`/location/${id}`)}
                        />
                    ))}

                    {/* Add Storage Unit Card */}
                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (coreGrid.length + customLocations.length) * 0.05 }}
                        whileHover={{ y: -8, boxShadow: "0 45px 90px rgba(0,0,0,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAddingLocation(true)}
                        className="rounded-[44px] p-8 border-4 border-dashed border-[#1A2119]/5 bg-white/50 flex flex-col items-center justify-center gap-6 group transition-all min-h-[260px] hover:bg-white hover:border-emerald-500/30"
                    >
                        <div className="w-20 h-20 rounded-[30px] bg-[#1A2119]/5 flex items-center justify-center text-[#1A2119]/20 group-hover:bg-[#1A2119] group-hover:text-white transition-all shadow-inner group-hover:rotate-90">
                            <Plus size={40} />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#1A2119]/30 group-hover:text-[#1A2119]">
                            Add Unit
                        </span>
                    </motion.button>
                </div>
            </div>

            {/* Creation Modals (Omitted for brevity, kept from original implementation) */}
            <AnimatePresence>
                {isAddingLocation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A2119]/60 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[50px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative"
                        >
                            <button onClick={() => setIsAddingLocation(false)} className="absolute top-10 right-10 p-2 text-[#1A2119]/20 hover:text-[#1A2119] transition-colors"><X size={28} /></button>
                            <h3 className="text-3xl font-black text-[#1A2119] mb-10 tracking-tight uppercase">New Storage Unit</h3>
                            <form onSubmit={handleCreateLocation} className="space-y-10">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A2119]/40 mb-4 block">Unit Name</label>
                                    <input autoFocus required value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="e.g. Pantry Fridge" className="w-full bg-[#1A2119]/[0.03] border-2 border-transparent focus:border-emerald-500/30 rounded-3xl px-8 py-5 text-xl font-black text-[#1A2119] outline-none transition-all placeholder:text-[#1A2119]/10" />
                                </div>
                                <button type="submit" className="w-full bg-[#1A2119] text-white py-6 rounded-3xl font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all text-[12px]">Create Unit</button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {isAddingZone && (
                   <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A2119]/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative">
                            <button onClick={() => setIsAddingZone(false)} className="absolute top-10 right-10 p-2 text-[#1A2119]/20 hover:text-[#1A2119] transition-colors"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-[#1A2119] mb-8 tracking-tight uppercase">New Zone</h3>
                            <form onSubmit={handleCreateZone} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A2119]/40 mb-4 block">Zone Name</label>
                                    <input autoFocus required value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="e.g. Bottom Crisper" className="w-full bg-[#1A2119]/[0.03] border-2 border-transparent focus:border-emerald-500/30 rounded-2xl px-8 py-4 text-lg font-black text-[#1A2119] outline-none transition-all" />
                                </div>
                                <button type="submit" className="w-full bg-[#1A2119] text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-600 transition-all text-[11px]">Create Zone</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}

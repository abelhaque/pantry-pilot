'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, ShoppingCart, Clock, AlertTriangle, Snowflake, Box, Archive, Edit3, Settings } from 'lucide-react'
import { ShoppingBags } from '@/components/ShoppingBags'

export default function Dashboard() {
    const { household, isLoading } = useHousehold()
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState('')
    const [shoppingListCount, setShoppingListCount] = useState(0)
    const [isEditingNames, setIsEditingNames] = useState(false)
    const [editedNames, setEditedNames] = useState<Record<string, string>>({})

    const fetchShoppingListCount = async () => {
        if (!household?.id) return
        try {
            const res = await fetch(`/api/shopping-list?householdId=${household.id}`)
            if (res.ok) {
                const data = await res.json()
                setShoppingListCount((data ?? []).filter((i: any) => !i.isPurchased).length)
            }
        } catch { /* non-fatal */ }
    }

    useEffect(() => {
        fetchShoppingListCount()
    }, [household])

    // --- Loading skeleton ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-[#2C3A2B] font-black uppercase tracking-widest animate-pulse">
                Loading Intelligence...
            </div>
        )
    }

    // --- Safe data derivation (all arrays guarded with ?. and fallbacks) ---
    const locations = household?.locations ?? []

    const allItems = locations.flatMap(loc =>
        (loc.zones ?? []).flatMap(zone => zone.items ?? [])
    )

    const expiringSoonCount = allItems.filter(item => {
        if (!item.expiry) return false
        const daysToExpiry = (new Date(item.expiry).getTime() - Date.now()) / (1000 * 3600 * 24)
        return daysToExpiry >= 0 && daysToExpiry <= 3
    }).length

    const lowStockCount = allItems.filter(item => (item.quantity ?? 0) <= 1).length

    const getIconForType = (type: string) => {
        switch ((type ?? '').toLowerCase()) {
            case 'fridge':   return <Snowflake size={28} />
            case 'freezer':  return <Snowflake size={28} className="text-blue-400" />
            case 'cupboard': return <Box size={28} />
            default:         return <Archive size={28} />
        }
    }

    const handleUpdateName = (locId: string, newName: string) => {
        setEditedNames(prev => ({ ...prev, [locId]: newName }))
    }

    // Always render the 4 storage cards, filling in empty slots if DB locations are missing
    const storageTypes = ['fridge', 'freezer', 'cupboard', 'other']
    const mainLocations = storageTypes.map(type => {
        const found = locations.find(l => (l.type ?? '').toLowerCase() === type)
        return found ?? { id: `placeholder-${type}`, name: type.charAt(0).toUpperCase() + type.slice(1), type, zones: [] }
    })

    return (
        <main className="container min-h-screen py-8 pb-32 animate-in fade-in duration-700">

            {/* 1. Search Bar */}
            <header className="mb-10 px-2">
                <div className="relative group">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Pantry..."
                        className="w-full h-18 pl-14 pr-6 rounded-[2rem] bg-white/40 border-none text-[#2C3A2B] placeholder-[#2C3A2B]/40 font-bold shadow-xl shadow-[#2C3A2B]/5 backdrop-blur-md focus:ring-4 focus:ring-[#8DAA81]/20 transition-all outline-none"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2C3A2B]/40" size={24} />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Settings
                            size={20}
                            className="text-[#2C3A2B]/40 cursor-pointer hover:text-[#2C3A2B] transition-colors"
                            onClick={() => router.push('/household/settings')}
                        />
                    </div>
                </div>
            </header>

            {/* 2. Stat Pills */}
            <div className="flex gap-4 mb-10 px-2">
                <button className="flex-1 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-between px-6 active:scale-95 transition-all shadow-sm group">
                    <div className="flex items-center gap-3">
                        <Clock size={16} className="text-[#2C3A2B]/40 group-hover:text-red-500 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2C3A2B]">Expiring</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black">{expiringSoonCount}</span>
                </button>
                <button className="flex-1 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-between px-6 active:scale-95 transition-all shadow-sm group">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={16} className="text-[#2C3A2B]/40 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2C3A2B]">Low Stock</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black">{lowStockCount}</span>
                </button>
            </div>

            {/* 3. Summary Cards */}
            <section className="grid grid-cols-2 gap-5 mb-10 px-2">
                <div className="card aspect-square bg-[#2C3A2B] text-white p-8 flex flex-col justify-between active:scale-95 transition-all shadow-2xl shadow-[#2C3A2B]/20 rounded-[2.5rem]">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-1">{allItems.length}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Total Inventory</div>
                    </div>
                </div>
                <div
                    onClick={() => router.push('/shopping-list')}
                    className="card aspect-square bg-[#8DAA81] text-white p-8 flex flex-col justify-between active:scale-95 transition-all shadow-2xl shadow-[#8DAA81]/20 rounded-[2.5rem] cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-1">{shoppingListCount}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Shopping List</div>
                    </div>
                </div>
            </section>

            {/* 4. Storage Grid */}
            <section className="space-y-5 px-2">
                <div
                    onClick={() => router.push('/shopping-list')}
                    className="active:scale-[0.98] transition-all"
                >
                    <ShoppingBags itemCount={shoppingListCount} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {mainLocations.map((loc) => (
                        <div key={loc.id} className="relative group h-48">
                            <div
                                onClick={() => loc.id.startsWith('placeholder-') ? undefined : router.push(`/location/${loc.id}`)}
                                className="card h-full p-6 flex flex-col justify-between bg-white/60 border-none backdrop-blur-md shadow-lg shadow-[#2C3A2B]/5 active:scale-95 transition-all cursor-pointer rounded-[2rem] border-b-4 border-b-[#2C3A2B]/5"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-[#2C3A2B]/5 flex items-center justify-center text-[#2C3A2B]">
                                        {getIconForType(loc.type)}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditingNames(!isEditingNames) }}
                                        className="p-2 text-[#2C3A2B]/20 hover:text-[#2C3A2B] transition-colors"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                </div>

                                <div>
                                    {isEditingNames ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent font-black text-sm uppercase tracking-tight text-[#2C3A2B] border-b border-[#2C3A2B]/20 outline-none w-full"
                                            defaultValue={editedNames[loc.id] || loc.name}
                                            onBlur={(e) => { handleUpdateName(loc.id, e.target.value); setIsEditingNames(false) }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3 className="font-black text-sm uppercase tracking-tight text-[#2C3A2B]">
                                            {editedNames[loc.id] || loc.name}
                                        </h3>
                                    )}
                                    <p className="text-[10px] font-black text-[#2C3A2B]/30 uppercase tracking-[0.2em]">
                                        {(loc.zones ?? []).length} Zones
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}

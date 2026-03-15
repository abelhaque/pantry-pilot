'use client'

import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { motion } from 'motion/react'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { CATEGORIES } from '@/types'

export default function Page() {
    const router = useRouter()
    const { household, isLoading } = useHousehold()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1A2119] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const storageUnits = [
        { name: 'Fridge', icon: '🌬️' },
        { name: 'Freezer', icon: '❄️' },
        { name: 'Cupboard', icon: '🥫' },
        { name: 'Other', icon: '📦' },
    ]

    const getUnitData = (unitName: string) => {
        const location = household?.locations?.find(
            l => l.name.toLowerCase().includes(unitName.toLowerCase())
        )
        
        const itemCount = location?.zones?.reduce((acc, zone) => acc + (zone.items?.length || 0), 0) || 0
        
        return {
            id: location?.id,
            count: itemCount,
            icon: location?.icon
        }
    }

    const shoppingBags = household?.locations?.find(l => l.name.toLowerCase().includes('shopping bags'))
    const shoppingBagsItems = shoppingBags?.zones?.flatMap(z => z.items || []) || []
    
    // Group by Aisle (Category)
    const aisleGroups = shoppingBagsItems.reduce((acc, item) => {
        const cat = item.shoppingCategory || 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {} as Record<string, typeof shoppingBagsItems>)

    // Sort aisles based on CATEGORIES order
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

    return (
        <main className="min-h-screen bg-[#F9F7F2] pb-24">
            <div className="max-w-5xl mx-auto px-6 pt-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-[#1A2119] tracking-tight mb-2">Pantry Pilot</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <p className="text-[#2C3A2B]/60 font-bold text-xs uppercase tracking-[0.2em]">{household?.name || 'Household Dashboard'}</p>
                    </div>
                </div>

                {/* Hero Card: Shopping Bags Restoration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button 
                        onClick={() => router.push('/shopping-list')}
                        className="w-full p-8 rounded-[40px] bg-[#1A2119] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all group relative overflow-hidden text-left"
                    >
                        {/* Tactile Glow & Gradient */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                        
                        <div className="flex flex-col gap-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        🛍️
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-2xl text-white mb-1">
                                            Shopping Bags
                                        </h4>
                                        <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                                            {shoppingBagsItems.length} items to sort
                                        </p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                                    <ChevronRight size={24} />
                                </div>
                            </div>

                            {/* Aisle Grouping (Horizontal Scroll) */}
                            {sortedAisles.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {sortedAisles.map((aisle) => (
                                        <div 
                                            key={aisle.name}
                                            className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-lg">{aisle.icon}</span>
                                            <span className="text-white/80 text-xs font-bold">{aisle.name}</span>
                                            <span className="text-emerald-500 text-[10px] font-black opacity-60 ml-1">{aisle.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="text-white/20 text-xs font-medium italic">Your bags are currently empty</p>
                                </div>
                            )}
                        </div>
                    </button>
                </motion.div>

                {/* 2x2 Storage Units Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {storageUnits.map((unit, idx) => {
                        const { id, count, icon } = getUnitData(unit.name)
                        
                        return (
                            <motion.button
                                key={unit.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -6, boxShadow: "0 30px 60px -12px rgba(0,0,0,0.25)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => id && router.push(`/location/${id}`)}
                                className="relative overflow-hidden rounded-[40px] p-8 text-left transition-all bg-gradient-to-br from-[#2C3A2B] to-[#1A2119] border border-white/10 shadow-2xl group min-h-[220px] flex flex-col justify-between"
                            >
                                {/* Tactile Glow Effect */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-colors"></div>
                                
                                <div className="text-5xl group-hover:scale-110 transition-transform duration-500 origin-left relative z-10">
                                    {icon || unit.icon}
                                </div>
                                
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-3">
                                        {unit.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.25em]">
                                            {count} Items
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </main>
    )
}

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useHousehold } from '@/providers/HouseholdProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  ChevronRight, 
  Package,
  MapPin,
  ArrowLeft
} from 'lucide-react'
import { VoiceInput } from '@/components/VoiceInput'
import { CATEGORIES } from '@/types'

export default function PantryPage() {
    const router = useRouter()
    const { household, isLoading } = useHousehold()
    const [searchQuery, setSearchQuery] = useState('')

    // --- Filtering Logic ---
    const allItems = useMemo(() => {
        if (!household?.locations) return []
        return household.locations.flatMap(loc => 
            loc.zones.flatMap(zone => 
                (zone.items || []).map(item => ({
                    ...item,
                    locationName: loc.name,
                    zoneName: zone.name,
                    locationId: loc.id
                }))
            )
        )
    }, [household])

    const filteredItems = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return allItems

        return allItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(query)
            const catMatch = (item.storageCategory || '').toLowerCase().includes(query)
            const aisleMatch = (item.shoppingCategory || '').toLowerCase().includes(query)
            return nameMatch || catMatch || aisleMatch
        })
    }, [allItems, searchQuery])

    // --- Aisle Grouping ---
    const groupedItems = useMemo(() => {
        const groups: Record<string, typeof filteredItems> = {}
        
        filteredItems.forEach(item => {
            const aisle = item.shoppingCategory || 'Uncategorized'
            if (!groups[aisle]) groups[aisle] = []
            groups[aisle].push(item)
        })

        // Sort groups by CATEGORIES order
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
            icon: CATEGORIES.find(c => c.name === name)?.icon || '📦',
            items: groups[name]
        }))
    }, [filteredItems])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1A2119] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#F9F7F2] pb-32">
            {/* Sticky Header with Search */}
            <div className="sticky top-0 z-50 bg-[#F9F7F2]/80 backdrop-blur-xl border-b border-[#1A2119]/5 px-6 py-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push('/')}
                            className="w-12 h-12 rounded-2xl bg-white border border-[#1A2119]/5 shadow-sm flex items-center justify-center text-[#1A2119]/40 hover:text-[#1A2119] transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </motion.button>
                        <div>
                            <h1 className="text-2xl font-black text-[#1A2119] tracking-tight leading-none">Pantry Search</h1>
                            <p className="text-[10px] font-bold text-[#1A2119]/40 uppercase tracking-[0.2em] mt-1">Real-time Inventory Filter</p>
                        </div>
                    </div>

                    <VoiceInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, category, or aisle..."
                        iconLeft={<Search size={20} />}
                        clearable
                        onClear={() => setSearchQuery('')}
                        className="shadow-[0_20px_40px_rgba(0,0,0,0.03)]"
                    />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                <AnimatePresence mode="popLayout">
                    {groupedItems.length > 0 ? (
                        groupedItems.map((group, gIdx) => (
                            <motion.section 
                                key={group.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: gIdx * 0.05 }}
                                className="mb-10 last:mb-0"
                            >
                                <div className="flex items-center gap-3 mb-6 px-2">
                                    <span className="text-2xl">{group.icon}</span>
                                    <h2 className="text-lg font-black text-[#1A2119] tracking-tight">{group.name}</h2>
                                    <span className="bg-[#1A2119]/5 text-[#1A2119]/40 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                                        {group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.items.map((item, iIdx) => (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => router.push(`/location/${item.locationId}`)}
                                            className="w-full text-left bg-white rounded-[32px] p-6 border border-[#1A2119]/5 shadow-sm group relative overflow-hidden flex items-center gap-5 transition-all"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-[#F9F7F2] border border-[#1A2119]/5 flex items-center justify-center text-2xl group-hover:bg-[#1A2119] group-hover:text-white transition-all duration-500 shadow-inner">
                                                {CATEGORIES.find(c => c.name === item.storageCategory)?.icon || '📦'}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#1A2119] truncate group-hover:translate-x-1 transition-transform">{item.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Qty: {item.quantity}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1A2119]/30 uppercase tracking-widest">
                                                        <MapPin size={10} />
                                                        <span className="truncate">{item.locationName} • {item.zoneName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-10 h-10 rounded-full border border-[#1A2119]/5 flex items-center justify-center text-[#1A2119]/20 group-hover:bg-[#1A2119] group-hover:text-white transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.section>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-24 h-24 rounded-[40px] bg-[#1A2119]/5 flex items-center justify-center text-4xl mb-6 text-[#1A2119]/10">
                                <Search size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-[#1A2119] mb-2">No items found</h3>
                            <p className="text-[#1A2119]/40 text-sm font-medium">Try searching for something else or check your spelling.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}

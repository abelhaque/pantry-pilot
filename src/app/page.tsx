'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus, Search, AlertTriangle, Settings
} from 'lucide-react'
import StorageGrid from '@/components/StorageGrid'
import { ShoppingBags } from '@/components/ShoppingBags'

export default function Dashboard() {
    const { household, isLoading } = useHousehold()
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState('')
    const [shoppingListCount, setShoppingListCount] = useState(0)

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

    useEffect(() => { fetchShoppingListCount() }, [household])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-charcoal font-black uppercase tracking-widest animate-pulse">
                Loading Intelligence...
            </div>
        )
    }

    const locations = household?.locations ?? []
    const allItems = locations.flatMap(loc =>
        (loc.zones ?? []).flatMap(zone => zone.items ?? [])
    )

    const expiringSoon = allItems.filter(item => {
        if (!item.expiry) return false
        const days = (new Date(item.expiry).getTime() - Date.now()) / (1000 * 3600 * 24)
        return days >= 0 && days <= 3
    })

    const lowStock = allItems.filter(item => (item.quantity ?? 0) <= 1)

    return (
        <main className="max-w-5xl mx-auto px-6 pt-6 pb-32">

            {/* --- Search Bar --- */}
            <div className="mb-8">
                <div className="relative">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search pantry..."
                        className="w-full py-3 pl-12 pr-12 rounded-[20px] bg-white/50 border-none text-charcoal placeholder-charcoal/40 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" size={18} />
                    <button
                        onClick={() => router.push('/household/settings')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-charcoal/30 hover:text-charcoal transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* --- Primary Feature Cards --- */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
                <div 
                    className="flex flex-col items-center justify-center h-44 hover:shadow-lg hover:-translate-y-1 transition-all group p-4 text-center rounded-[20px] bg-white tactile-card cursor-pointer"
                    onClick={() => router.push('/inventory')}
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🌿</div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans mb-1">Total Items</span>
                        <span className="text-4xl font-bold text-charcoal tracking-tight leading-none">{allItems.length}</span>
                    </div>
                </div>
                <div 
                    className="flex flex-col items-center justify-center h-44 hover:shadow-lg hover:-translate-y-1 transition-all group p-4 text-center rounded-[20px] bg-white tactile-card cursor-pointer"
                    onClick={() => router.push('/shopping-list')}
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🛒</div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans mb-1">To Buy</span>
                        <span className="text-4xl font-bold text-charcoal tracking-tight leading-none">{shoppingListCount}</span>
                    </div>
                </div>
            </div>

            {/* --- Quick Stats Pills --- */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={() => router.push('/inventory')}
                    className="px-4 py-2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm flex items-center gap-2 hover:bg-white/30 transition-all tactile-button"
                >
                    <div className={`w-2 h-2 rounded-full ${expiringSoon.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-zinc-300'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Expiring Soon</span>
                    <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">{expiringSoon.length}</span>
                </button>
                <button
                    onClick={() => router.push('/inventory')}
                    className="px-4 py-2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm flex items-center gap-2 hover:bg-white/30 transition-all tactile-button"
                >
                    <div className={`w-2 h-2 rounded-full ${lowStock.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-zinc-300'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Low Stock</span>
                    <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">{lowStock.length}</span>
                </button>
            </div>

            {/* --- Alert Cards --- */}
            {(expiringSoon.length > 0 || lowStock.length > 0) && (
                <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#B08D57]">Attention Required</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[...expiringSoon.slice(0, 2), ...lowStock.slice(0, 2)].slice(0, 4).map(item => {
                            const isLow = (item.quantity ?? 0) <= 1
                            const isExpiring = !!item.expiry && new Date(item.expiry) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                            return (
                                <div key={item.id} className={`flex items-center gap-4 p-4 border rounded-2xl ${isLow ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="text-2xl">📦</div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                        <div className="flex items-center gap-2">
                                            {isExpiring && <p className="text-[10px] text-amber-600 font-bold">Expires soon</p>}
                                            {isLow && <p className="text-[10px] text-red-600 font-bold">Low Stock: {item.quantity}</p>}
                                        </div>
                                    </div>
                                    <AlertTriangle className={isLow ? 'text-red-500' : 'text-amber-500'} size={18} />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* --- Storage Units Section --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#B08D57]">Storage Units</h3>
                    <button
                        onClick={() => router.push('/household/settings')}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-charcoal px-3 py-1.5 rounded-xl hover:bg-white/40 transition-all"
                    >
                        <Plus size={14} /> Add Unit
                    </button>
                </div>

                {/* Hero Card: Shopping Bags */}
                <div className="card-3d-wrap">
                    <div className="card-3d-inner">
                        <div onClick={() => router.push('/shopping-list')}>
                            <ShoppingBags itemCount={shoppingListCount} />
                        </div>
                    </div>
                </div>

                <div className="card-3d-wrap">
                    <div className="card-3d-inner">
                        <StorageGrid locations={locations} searchQuery={searchQuery} />
                    </div>
                </div>
            </div>
        </main>
    )
}

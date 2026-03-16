'use client'

import { useRouter } from 'next/navigation'
import { Plus, Pencil, ChevronRight, ShoppingCart } from 'lucide-react'

// --- Haptic & Sound Utilities ---
const playClick = () => {
    try {
        if (typeof window === 'undefined') return
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return

        const audioCtx = new AudioContextClass()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(150, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
        osc.connect(gain); gain.connect(audioCtx.destination)
        osc.start(); osc.stop(audioCtx.currentTime + 0.05)
        if (audioCtx.state === 'suspended') audioCtx.resume()
    } catch (e) {}
}

const triggerHaptic = (pattern: number | number[] = 8) => {
    try { navigator.vibrate(pattern) } catch (e) {}
}

const withFeedback = (fn: () => void) => () => { triggerHaptic(); playClick(); fn() }

const Card = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <div
        onClick={onClick ? withFeedback(onClick) : undefined}
        className={`rounded-[20px] p-4 tactile-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
        {children}
    </div>
)

interface StorageGridProps {
    locations: any[]
    searchQuery: string
}

export default function StorageGrid({ locations, searchQuery }: StorageGridProps) {
    const router = useRouter()

    const getLocationIcon = (name: string, type: string): string => {
        const lower = (name + ' ' + type).toLowerCase()
        if (lower.includes('fridge')) return '🌬️'
        if (lower.includes('freezer')) return '❄️'
        if (lower.includes('shopping') || lower.includes('bag')) return '🛍️'
        if (lower.includes('cupboard') || lower.includes('pantry')) return '🥫'
        return '🏠'
    }

    const shoppingBagsLoc = locations.find(l => l.name.toLowerCase().includes('shopping bag'))
    const otherLocations = locations.filter(l => !l.name.toLowerCase().includes('shopping bag'))

    return (
        <div className="space-y-4">
            {/* Hero Card: Shopping Bags */}
            {shoppingBagsLoc && (() => {
                const locItems = (shoppingBagsLoc.zones ?? []).flatMap((z: any) => z.items ?? [])
                return (
                    <Card
                        key={shoppingBagsLoc.id}
                        className="group hover:border-black transition-all relative bg-off-white border-secondary/20"
                        onClick={() => router.push('/shopping-list')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl group-hover:bg-secondary group-hover:text-white transition-colors">
                                    {getLocationIcon(shoppingBagsLoc.name, shoppingBagsLoc.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-charcoal">{shoppingBagsLoc.name}</h4>
                                    <p className="text-xs text-zinc-500">{locItems.length} items to sort</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-10 bg-[#8DAA81] text-white rounded-full flex items-center justify-center shadow-md">
                                    <ShoppingCart size={18} />
                                </span>
                                <ChevronRight size={20} className="text-zinc-300 group-hover:text-secondary" />
                            </div>
                        </div>
                    </Card>
                )
            })()}

            {/* Units Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {otherLocations.map(loc => {
                    const locItems = (loc.zones ?? []).flatMap((z: any) => z.items ?? [])
                    if (locItems.length === 0 && searchQuery) return null
                    return (
                        <div key={loc.id} className="card-3d-wrap">
                            <div className="card-3d-inner">
                                <Card
                                    className="group hover:border-black transition-all relative bg-off-white !p-3"
                                    onClick={() => router.push(`/location/${loc.id}`)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                            {getLocationIcon(loc.name, loc.type)}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push('/household/settings') }}
                                            className="p-1 text-zinc-300 hover:text-primary transition-all"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    </div>
                                    <div className="overflow-hidden mb-4">
                                        <h4 className="font-bold text-sm truncate">{loc.name}</h4>
                                        <p className="text-[10px] text-zinc-400 font-medium">{locItems.length} items</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(`/location/${loc.id}`) }}
                                        className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-all z-20"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </Card>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

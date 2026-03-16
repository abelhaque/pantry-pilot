'use client'

import { useState, useEffect } from 'react'
import { LibraryItem } from '@/types'
import { CATEGORIES } from '@/utils/categories'
import { Search, Package, Calendar, MapPin, Tag, Plus, Minus, X } from 'lucide-react'

interface AddItemProps {
    onAdd: (item: any) => Promise<void>
    onCancel: () => void
    zones: { id: string, name: string }[]
    initialValues?: { name?: string, quantity?: number, unit?: string, category?: string }
}

export default function AddItem({ onAdd, onCancel, zones, initialValues }: AddItemProps) {
    const [name, setName] = useState(initialValues?.name || '')
    const [matches, setMatches] = useState<LibraryItem[]>([])
    const [expiry, setExpiry] = useState('')

    const [quantity, setQuantity] = useState<number>(Number(initialValues?.quantity) || 1)
    const [unit, setUnit] = useState(initialValues?.unit || 'item')
    const [category, setCategory] = useState(initialValues?.category || 'Other')
    const [zoneId, setZoneId] = useState(zones[0]?.id || '')

    useEffect(() => {
        if (name.length < 2) {
            setMatches([])
            return
        }
        const timer = setTimeout(async () => {
            const res = await fetch(`/api/library?q=${encodeURIComponent(name)}`)
            if (res.ok) {
                setMatches(await res.json())
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [name])

    const selectMatch = (match: LibraryItem) => {
        setName(match.name)
        setCategory(match.category)
        if (match.defaultUnit) setUnit(match.defaultUnit)
        setMatches([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        let parsedExpiry = null
        if (expiry) {
            // Robust parsing for YYYY-MM-DD
            const [y, m, d] = expiry.split('-').map(Number)
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                parsedExpiry = new Date(y, m - 1, d)
            }
        }

        await onAdd({
            name,
            quantity: Number(quantity),
            unit,
            category,
            zoneId,
            expiry: parsedExpiry
        })
    }

    return (
        <div className="card bg-white p-8 rounded-[2.5rem] border-none shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-[#2C3A2B]">Restock Pantry</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/30">Add inventory details</p>
                </div>
                <button 
                  onClick={onCancel}
                  className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-[#2C3A2B]/30 hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Name */}
                <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2C3A2B]/20">
                        <Search size={18} />
                    </div>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 rounded-2xl bg-zinc-50 border-none text-[#2C3A2B] font-bold placeholder-[#2C3A2B]/30 focus:ring-4 focus:ring-[#8DAA81]/10 transition-all outline-none"
                        placeholder="What are you adding?"
                        required
                        autoFocus
                    />
                    {matches.length > 0 && (
                        <ul className="absolute z-20 w-full bg-white border border-zinc-100 rounded-2xl shadow-xl mt-2 max-h-48 overflow-auto p-2">
                            {matches.map(m => (
                                <li
                                    key={m.id}
                                    onClick={() => selectMatch(m)}
                                    className="p-4 hover:bg-zinc-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                    <span className="font-bold text-[#2C3A2B]">{m.name}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2C3A2B]/20 group-hover:text-[#8DAA81]">{m.category}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between">
                        <button 
                            type="button" 
                            onClick={() => setQuantity(Math.max(0, quantity - 1))}
                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#2C3A2B] shadow-sm active:scale-90 transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <div className="text-center">
                            <div className="text-xl font-black text-[#2C3A2B]">{quantity}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-[#2C3A2B]/30">Quantity</div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-[#2C3A2B] flex items-center justify-center text-white shadow-lg shadow-[#2C3A2B]/20 active:scale-90 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C3A2B]/20">
                            <Package size={16} />
                        </div>
                        <select 
                            value={unit} 
                            onChange={e => setUnit(e.target.value)} 
                            className="w-full h-full min-h-[64px] pl-11 pr-4 rounded-2xl bg-zinc-50 border-none text-[#2C3A2B] font-bold outline-none appearance-none"
                        >
                            <option value="item">Item</option>
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
                </div>

                {/* Category Selection */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#2C3A2B]/30 px-2 mb-3 block text-center">Shelf Category</label>
                    <div className="flex flex-wrap justify-center gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                type="button"
                                onClick={() => setCategory(cat.name)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                                    category === cat.name ? 'bg-[#8DAA81] text-white shadow-lg shadow-[#8DAA81]/20 scale-110' : 'bg-zinc-50 text-[#2C3A2B]/20 hover:bg-zinc-100'
                                }`}
                                title={cat.name}
                            >
                                <span className={category === cat.name ? 'grayscale-0' : 'grayscale opacity-50'}>{cat.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zone & Expiry */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C3A2B]/20">
                            <MapPin size={16} />
                        </div>
                        <select 
                            value={zoneId} 
                            onChange={e => setZoneId(e.target.value)} 
                            className="w-full h-16 pl-11 pr-4 rounded-2xl bg-zinc-50 border-none text-[10px] font-black uppercase tracking-tight text-[#2C3A2B] outline-none appearance-none"
                        >
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C3A2B]/20 pointer-events-none">
                            <Calendar size={16} />
                        </div>
                        <input
                            type="date"
                            className="w-full h-16 pl-11 pr-4 rounded-2xl bg-zinc-50 border-none text-[10px] font-black uppercase text-[#2C3A2B] outline-none"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button 
                        type="submit" 
                        className="flex-1 h-16 bg-[#2C3A2B] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl shadow-[#2C3A2B]/30 active:scale-95 transition-all"
                    >
                        Confirm Restock
                    </button>
                </div>
            </form>
        </div>
    )
}

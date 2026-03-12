'use client'

import { useState, useEffect } from 'react'
import { LibraryItem } from '@/types'

interface AddItemProps {
    onAdd: (item: any) => Promise<void>
    onCancel: () => void
    zones: { id: string, name: string }[]
    initialValues?: { name?: string, quantity?: number, unit?: string, category?: string }
}

import { CATEGORIES } from '@/utils/categories'

export default function AddItem({ onAdd, onCancel, zones, initialValues }: AddItemProps) {
    const [name, setName] = useState(initialValues?.name || '')
    const [matches, setMatches] = useState<LibraryItem[]>([])
    const [expiry, setExpiry] = useState('')

    const [quantity, setQuantity] = useState<number | string>(initialValues?.quantity || 1)
    const [unit, setUnit] = useState(initialValues?.unit || 'item')
    const [category, setCategory] = useState(initialValues?.category || 'Other')
    const [zoneId, setZoneId] = useState(zones[0]?.id || '')

    // Predictive Search
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
        // Validation...
        await onAdd({
            name,
            quantity: Number(quantity),
            unit,
            category,
            zoneId,
            expiry: expiry ? new Date(expiry) : null
        })
    }

    return (
        <div className="card border-primary">
            <h3 className="text-lg font-medium mb-4">Add Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name Input with Autocomplete */}
                <div className="relative">
                    <label className="text-sm font-medium">Item Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        placeholder="e.g. Milk"
                        required
                        autoFocus
                    />
                    {matches.length > 0 && (
                        <ul className="absolute z-10 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-40 overflow-auto">
                            {matches.map(m => (
                                <li
                                    key={m.id}
                                    onClick={() => selectMatch(m)}
                                    className="p-2 hover:bg-secondary cursor-pointer border-b last:border-0"
                                >
                                    {m.name} <span className="text-muted-foreground text-xs">({m.category})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quantity Mode */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Quantity</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="input"
                                step={unit === 'item' ? 1 : 0.1}
                                required
                            />
                        </div>
                    </div>
                    <div className="w-1/3">
                        <label className="text-sm font-medium">Unit</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)} className="input">
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
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                type="button"
                                onClick={() => setCategory(cat.name)}
                                className={`text-2xl p-2 rounded-lg border ${category === cat.name ? 'border-primary bg-secondary' : 'border-transparent hover:bg-muted'}`}
                                title={cat.name}
                            >
                                {cat.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zone Selection */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Zone</label>
                        <select value={zoneId} onChange={e => setZoneId(e.target.value)} className="input">
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium">Expiry</label>
                        <input
                            type="date"
                            className="input"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Add to Inventory</button>
                </div>

            </form>
        </div>
    )
}

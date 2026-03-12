'use client'

import { useState } from 'react'
import { Household, Location, Item } from '@/types'

interface MoveItemModalProps {
    item: Item
    locations: Location[]
    onMove: (itemId: string, newZoneId: string) => Promise<void>
    onCancel: () => void
}

export default function MoveItemModal({ item, locations, onMove, onCancel }: MoveItemModalProps) {
    // Default to current location? Or first available?
    // Let's find the current location of the item to pre-select it?
    // Actually, finding it might be expensive if not passed. 
    // Let's just default to the first location/zone.

    // We can try to find the current location if we want, but "Move" usually implies somewhere else.
    // Let's default to the *first* location in the list.

    const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '')

    const selectedLocation = locations.find(l => l.id === selectedLocationId)
    const zones = selectedLocation?.zones || []

    const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || '')

    const handleLocationChange = (locId: string) => {
        setSelectedLocationId(locId)
        const loc = locations.find(l => l.id === locId)
        if (loc && loc.zones.length > 0) {
            setSelectedZoneId(loc.zones[0].id)
        } else {
            setSelectedZoneId('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedZoneId) {
            await onMove(item.id, selectedZoneId)
        }
    }

    return (
        <div className="card border-primary p-6">
            <h3 className="text-lg font-semibold mb-4">Move "{item.name}"</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">To Location</label>
                    <select
                        value={selectedLocationId}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="input"
                    >
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.type})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">To Zone</label>
                    <select
                        value={selectedZoneId}
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                        className="input"
                        disabled={zones.length === 0}
                    >
                        {zones.map(z => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={!selectedZoneId}>
                        Confirm Move
                    </button>
                </div>
            </form>
        </div>
    )
}

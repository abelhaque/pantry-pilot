'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCategoryIcon } from '@/utils/categories'
import { Item } from '@/types'

export default function Dashboard() {
  const { household, isLoading, createLocation } = useHousehold()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState('pantry')

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Pantry Pilot...</div>
  }

  if (!household) {
    return <div className="p-8">Error loading household.</div>
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName) return
    await createLocation(newLocName, newLocType)
    setIsAdding(false)
    setNewLocName('')
  }

  // Flatten and group all items by mathematical category for the Aisle view
  const allItems = household.locations.flatMap(loc => 
    loc.zones.flatMap(zone => zone.items)
  )

  const itemsByCategory = allItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof allItems>)

  return (
    <main className="container min-h-screen py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pantry Pilot</h1>
        <div className="text-sm text-muted-foreground">{household.name}</div>
      </header>

      {/* Overview Cards */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div
          className="card p-4 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/shopping-list')}
        >
          <div className="text-muted-foreground text-sm font-medium">Shopping List</div>
          <div className="text-3xl font-bold mt-2">Open</div>
        </div>
        {/* Placeholder for Expiring Soon */}
        <div className="card p-4 flex flex-col justify-between opacity-50">
          <div className="text-muted-foreground text-sm font-medium">Expiring Soon</div>
          <div className="text-3xl font-bold mt-2">-</div>
        </div>
      </section>

      {/* Locations Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Inventory by Aisle</h2>
              <button
                onClick={() => router.push('/household/settings')}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary px-2 py-1 rounded-md"
              >
                Settings
              </button>
          </div>
        </div>

        <div className="space-y-6">
            {Object.entries(itemsByCategory).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-input rounded-xl bg-secondary/20">
                    Your pantry is completely empty. Head to a Storage Unit to add items!
                </div>
            ) : (
                Object.entries(itemsByCategory)
                    .sort(([catA], [catB]) => catA.localeCompare(catB))
                    .map(([category, items]) => (
                        <div key={category} className="card overflow-hidden">
                            <div className="bg-secondary/50 p-3 font-semibold text-sm border-b flex items-center gap-2">
                                <span className="text-xl">{getCategoryIcon(category)}</span>
                                <span>{category} ({items.length})</span>
                            </div>
                            <div className="divide-y">
                                {items.map((item: Item) => (
                                    <div key={item.id} className="p-3 flex justify-between items-center text-sm hover:bg-secondary/20 transition-colors">
                                        <span className="font-medium">{item.name}</span>
                                        <div className="flex items-center gap-4 text-muted-foreground">
                                            <span>{item.quantity} {item.unit}</span>
                                            <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                                                {household.locations.find(l => l.zones.some(z => z.id === item.zoneId))?.name}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
            )}
        </div>
      </section>

      {/* Legacy Storage Unit Navigation */}
      <section className="mt-12 pt-8 border-t">
          <h2 className="text-lg font-semibold mb-4">Manage Storage Units</h2>
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {household.locations.map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => router.push(`/location/${loc.id}`)}
                  className="btn btn-secondary whitespace-nowrap text-sm"
                >
                    {loc.name}
                </button>
            ))}
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="btn btn-outline border-dashed whitespace-nowrap text-sm text-muted-foreground"
            >
                + New Unit
            </button>
          </div>

          {isAdding && (
          <form onSubmit={handleAddLocation} className="card mt-4 p-4 animate-in slide-in-from-top-4">
            <h3 className="text-sm font-medium mb-3">New Storage Unit</h3>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="Name (e.g. Kitchen Fridge)"
                className="input flex-1"
                autoFocus
              />
              <select
                value={newLocType}
                onChange={(e) => setNewLocType(e.target.value)}
                className="input sm:w-32"
              >
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Pantry</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" className="btn btn-primary sm:w-auto w-full">
                Create
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

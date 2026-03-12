'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/utils/categories'
import { Item } from '@/types'
import * as LucideIcons from 'lucide-react'

// Dynamic Icon Component
const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Package
  return <IconComponent className={className} size={20} />
}

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
    return <div className="p-8 text-center">
      <h1 className="text-xl font-bold mb-4">No Household Found</h1>
      <button onClick={() => router.push('/login')} className="btn btn-primary">Go to Login</button>
    </div>
  }

  const handleCreateLoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName) return
    await createLocation(newLocName, newLocType)
    setIsAdding(false)
    setNewLocName('')
  }

  // FORCE: Flatten and group all items by category for the Aisle view
  const allItems = household.locations.flatMap(loc => 
    loc.zones.flatMap(zone => zone.items)
  )

  const itemsByCategory = allItems.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) {
      acc[cat] = []
    }
    acc[cat].push(item)
    return acc
  }, {} as Record<string, typeof allItems>)

  // Ensure all categories are shown even if empty (Optional, but user said "even if pantry is empty")
  // Let's just show categories that HAVE items or all categories?
  // "The Dashboard (src/app/page.tsx) must show the Category/Aisle grouping even if the pantry is empty."
  // This implies we should display the categories even if they have 0 items.
  
  const sortedCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: itemsByCategory[cat.name] || []
  })).sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name))

  return (
    <main className="container min-h-screen py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-primary">Pantry Pilot</h1>
           <div className="text-sm font-medium text-muted-foreground">{household.name}</div>
        </div>
        <button
          onClick={() => router.push('/household/settings')}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          title="Household Settings"
        >
          <LucideIcons.Settings size={20} className="text-muted-foreground" />
        </button>
      </header>

      {/* Primary Actions */}
      <section className="grid grid-cols-2 gap-4 mb-10">
        <button
          className="card p-6 flex flex-col items-start gap-3 hover:border-primary transition-all group"
          onClick={() => router.push('/shopping-list')}
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <LucideIcons.ShoppingCart size={24} />
          </div>
          <div>
            <div className="text-left font-bold text-lg">Shopping List</div>
            <div className="text-left text-sm text-muted-foreground">View needed items</div>
          </div>
        </button>
        
        <button
          className="card p-6 flex flex-col items-start gap-3 hover:border-primary transition-all group opacity-50 cursor-not-allowed"
          disabled
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
            <LucideIcons.Clock size={24} />
          </div>
          <div>
            <div className="text-left font-bold text-lg">Expiring Soon</div>
            <div className="text-left text-sm text-muted-foreground">Coming soon</div>
          </div>
        </button>
      </section>

      {/* Inventory by Aisle */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LucideIcons.LayoutGrid size={20} className="text-primary" />
            Inventory by Aisle
          </h2>
        </div>

        <div className="space-y-4">
            {sortedCategories.map((category) => (
                <div key={category.name} className={`card overflow-hidden p-0 ${category.items.length === 0 ? 'opacity-40' : ''}`}>
                    <div className="bg-secondary/30 p-4 flex items-center justify-between border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-primary">
                                <IconRenderer name={category.icon} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide uppercase">{category.name}</h3>
                                <p className="text-xs text-muted-foreground">{category.items.length} items</p>
                            </div>
                        </div>
                    </div>
                    {category.items.length > 0 && (
                        <div className="divide-y divide-secondary/50">
                            {category.items.map((item: Item) => (
                                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-secondary/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{item.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {household.locations.find(l => l.zones.some(z => z.id === item.zoneId))?.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary">{item.quantity} <span className="text-xs font-normal text-muted-foreground uppercase">{item.unit}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </section>

      {/* Storage Units */}
      <section className="mt-12 pt-8 border-t border-secondary">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Storage Units</h2>
              <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-primary text-sm font-bold hover:underline"
              >
                  {isAdding ? 'Cancel' : '+ Add Unit'}
              </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-6 hide-scrollbar">
            {household.locations.map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => router.push(`/location/${loc.id}`)}
                  className="card p-4 min-w-[140px] flex flex-col items-center gap-2 hover:bg-secondary transition-colors"
                >
                    <div className="text-2xl opacity-80">
                      {loc.type === 'fridge' ? '❄️' : loc.type === 'freezer' ? '🧊' : '📦'}
                    </div>
                    <span className="font-bold text-xs uppercase tracking-tight">{loc.name}</span>
                </button>
            ))}
          </div>

          {isAdding && (
          <form onSubmit={handleCreateLoc} className="card mt-2 p-6 animate-in fade-in slide-in-from-top-2 border-primary">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-primary">New Storage Unit</h3>
            <div className="space-y-4">
              <input
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="Name (e.g. Garage Freezer)"
                className="input"
                autoFocus
              />
              <div className="flex gap-2">
                  <select
                    value={newLocType}
                    onChange={(e) => setNewLocType(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                    <option value="pantry">Pantry</option>
                    <option value="other">Other</option>
                  </select>
                  <button type="submit" className="btn btn-primary px-8">
                    Create
                  </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

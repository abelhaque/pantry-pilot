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

import { ShoppingBags } from '@/components/ShoppingBags'
import { useEffect } from 'react'

export default function Dashboard() {
  const { household, isLoading, createLocation } = useHousehold()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocType, setNewLocType] = useState('pantry')
  const [shoppingListCount, setShoppingListCount] = useState(0)

  const fetchShoppingListCount = async () => {
    if (!household) return
    const res = await fetch(`/api/shopping-list?householdId=${household.id}`)
    if (res.ok) {
      const data = await res.json()
      setShoppingListCount(data.filter((i: any) => !i.isPurchased).length)
    }
  }

  useEffect(() => {
    fetchShoppingListCount()
  }, [household])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-[#2C3A2B] font-bold">Loading Pantry Pilot...</div>
  }

  if (!household) {
    return <div className="p-8 text-center bg-white/10 min-h-screen">
      <h1 className="text-xl font-bold mb-4 text-white">No Household Found</h1>
      <button onClick={() => router.push('/login')} className="btn bg-white text-[#8DAA81]">Go to Login</button>
    </div>
  }

  // ... (rest of the logic remains the same for filtering items)
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

  const sortedCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: itemsByCategory[cat.name] || []
  })).sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name))

  const handleCreateLoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName) return
    await createLocation(newLocName, newLocType)
    setIsAdding(false)
    setNewLocName('')
  }

  return (
    <main className="container min-h-screen py-8">
      <header className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/60">Live Sync</span>
        </div>
        <div className="flex items-center gap-4">
          <LucideIcons.Settings 
            size={20} 
            className="text-[#2C3A2B]/60 cursor-pointer hover:text-[#2C3A2B] transition-colors" 
            onClick={() => router.push('/household/settings')}
          />
          <LucideIcons.LogOut size={20} className="text-[#2C3A2B]/60" />
        </div>
      </header>

      <section className="mb-10 px-2">
        <h1 className="text-4xl font-black text-[#2C3A2B] mb-1">{household.name}</h1>
        <p className="text-sm font-bold text-[#2C3A2B]/40 uppercase tracking-widest">Household Dashboard</p>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 gap-4 mb-8 px-2">
        <div className="card p-6 bg-white/20 border-none backdrop-blur-sm">
          <div className="text-3xl font-black text-[#2C3A2B]">{allItems.length}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/50">Total Items</div>
        </div>
        <div 
          onClick={() => router.push('/shopping-list')}
          className="card p-6 bg-white/20 border-none backdrop-blur-sm cursor-pointer hover:bg-white/40 transition-all"
        >
          <div className="text-3xl font-black text-[#2C3A2B]">{shoppingListCount}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/50">To Buy</div>
        </div>
      </section>

      {/* Shopping Bags Integration */}
      <section className="mb-10 px-2" onClick={() => router.push('/shopping-list')}>
        <ShoppingBags itemCount={shoppingListCount} />
      </section>

      {/* Storage Units */}
      <section className="mb-12 px-2">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/40">Storage Units</h2>
              <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-[#2C3A2B] text-xs font-bold hover:underline"
              >
                  {isAdding ? 'Cancel' : '+ Add Unit'}
              </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar">
            {household.locations.map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => router.push(`/location/${loc.id}`)}
                  className="card p-6 min-w-[160px] flex flex-col items-center gap-4 bg-white/40 border-none backdrop-blur-sm hover:scale-105 transition-all"
                >
                    <div className="text-4xl">
                      {loc.type === 'fridge' ? '❄️' : loc.type === 'freezer' ? '🧊' : '📦'}
                    </div>
                    <span className="font-black text-xs uppercase tracking-tight text-[#2C3A2B]">{loc.name}</span>
                </button>
            ))}
          </div>

          {isAdding && (
          <form onSubmit={handleCreateLoc} className="card mt-2 p-8 bg-white/60 border-none backdrop-blur-md animate-in slide-in-from-top-4">
            <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-[#2C3A2B]">New Storage Unit</h3>
            <div className="space-y-4">
              <input
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="Name (e.g. Garage Freezer)"
                className="w-full h-14 px-6 rounded-2xl bg-white/50 border-none text-[#2C3A2B] font-bold outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                  <select
                    value={newLocType}
                    onChange={(e) => setNewLocType(e.target.value)}
                    className="flex-1 h-14 px-6 rounded-2xl bg-white/50 border-none text-[#2C3A2B] font-bold outline-none"
                  >
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                    <option value="pantry">Pantry</option>
                    <option value="other">Other</option>
                  </select>
                  <button type="submit" className="h-14 px-8 bg-[#2C3A2B] text-white font-black rounded-2xl">
                    Create
                  </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Inventory Search */}
      <section className="mb-10 px-2">
        <div className="relative group">
            <input
                placeholder="Explore Pantry..."
                className="w-full h-16 pl-14 pr-6 rounded-3xl bg-white/20 border-none text-[#2C3A2B] placeholder-[#2C3A2B]/30 font-bold focus:ring-4 focus:ring-[#2C3A2B]/5 transition-all outline-none"
            />
            <LucideIcons.Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2C3A2B]/30" size={24} />
        </div>
      </section>

      {/* Inventory by Aisle */}
      <section className="px-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#2C3A2B]/40">Inventory by Aisle</h2>
        </div>

        <div className="space-y-4">
            {sortedCategories.map((category) => (
                <div key={category.name} className={`card border-none bg-white/40 p-0 overflow-hidden ${category.items.length === 0 ? 'opacity-30' : ''}`}>
                    <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-[#2C3A2B]">
                                <IconRenderer name={category.icon} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-tight text-[#2C3A2B]">{category.name}</h3>
                                <p className="text-[10px] font-bold text-[#2C3A2B]/40 uppercase tracking-widest">{category.items.length} items</p>
                            </div>
                        </div>
                    </div>
                    {category.items.length > 0 && (
                        <div className="bg-white/30 divide-y divide-black/5">
                            {category.items.map((item: Item) => (
                                <div key={item.id} className="p-5 flex justify-between items-center hover:bg-white/20 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#2C3A2B]">{item.name}</span>
                                        <span className="text-[9px] font-bold text-[#2C3A2B]/30 uppercase tracking-widest">
                                            {household.locations.find(l => l.zones.some(z => z.id === item.zoneId))?.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-[#2C3A2B]">{item.quantity} <span className="text-[10px] font-bold text-[#2C3A2B]/40">{item.unit}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </section>
    </main>
  )
}

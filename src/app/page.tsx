'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
              <h2 className="text-lg font-semibold">Storage Units</h2>
              <button
                onClick={() => router.push('/household/settings')}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary px-2 py-1 rounded-md"
              >
                Settings
              </button>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {isAdding ? 'Cancel' : '+ Add Unit'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddLocation} className="card mb-6 animate-in slide-in-from-top-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {household.locations.map((loc) => (
            <div key={loc.id} onClick={() => window.location.href = `/location/${loc.id}`} className="card hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{loc.type}</p>
                </div>
                <span className="text-2xl">
                  {loc.type === 'fridge' && '❄️'}
                  {loc.type === 'freezer' && '🧊'}
                  {loc.type === 'pantry' && '🥫'}
                  {loc.type === 'other' && '📦'}
                </span>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {loc.zones.length} Zones
              </div>
            </div>
          ))}

          {household.locations.length === 0 && (
            <div className="col-span-1 sm:col-span-2 p-8 text-center text-muted-foreground border-2 border-dashed border-input rounded-xl">
              No storage units yet. Create one to get started!
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

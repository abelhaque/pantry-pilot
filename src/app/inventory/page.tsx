'use client'

import { useHousehold } from '@/providers/HouseholdProvider'
import { useRouter } from 'next/navigation'
import * as LucideIcons from 'lucide-react'

export default function InventoryDeepDive() {
  const { household, isLoading } = useHousehold()
  const router = useRouter()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-[#2C3A2B] font-bold">Loading Inventory...</div>
  }

  if (!household) return null

  return (
    <main className="container min-h-screen py-8 pb-32">
      <header className="mb-10 px-2">
        <h1 className="text-4xl font-black text-[#2C3A2B] mb-1">Inventory</h1>
        <p className="text-sm font-bold text-[#2C3A2B]/40 uppercase tracking-widest">Pantry Deep Dive</p>
      </header>

      <section className="grid grid-cols-1 gap-4 px-2">
        {household.locations.map((loc) => (
          <div 
            key={loc.id}
            onClick={() => router.push(`/location/${loc.id}`)}
            className="card p-8 bg-white/40 border-none backdrop-blur-md flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:bg-white/60"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-4xl shadow-sm">
                {loc.type === 'fridge' ? '❄️' : loc.type === 'freezer' ? '🧊' : '📦'}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#2C3A2B]">{loc.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#2C3A2B]/40">{loc.type}</span>
                  <span className="w-1 h-1 rounded-full bg-[#2C3A2B]/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8DAA81]">
                    {loc.zones.reduce((acc, z) => acc + z.items.length, 0)} Items
                  </span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center text-[#2C3A2B]/20 group-hover:text-[#2C3A2B] group-hover:bg-white transition-all">
              <LucideIcons.ChevronRight size={24} />
            </div>
          </div>
        ))}

        <button 
          onClick={() => router.push('/')}
          className="card p-8 border-2 border-dashed border-[#2C3A2B]/10 bg-transparent flex flex-col items-center justify-center gap-3 text-[#2C3A2B]/30 hover:border-[#8DAA81] hover:text-[#8DAA81] transition-all"
        >
          <LucideIcons.Plus size={32} />
          <span className="text-xs font-black uppercase tracking-widest">Add Storage Unit</span>
        </button>
      </section>

      {/* Decorative summary card */}
      <section className="mt-12 px-2">
        <div className="card bg-[#2C3A2B] p-10 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2">Household Stats</h2>
              <div className="flex gap-6 mt-4">
                 <div>
                    <div className="text-2xl font-black">
                      {household.locations.length}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">Locations</div>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div>
                    <div className="text-2xl font-black text-[#8DAA81]">
                      {household.locations.flatMap(l => l.zones.flatMap(z => z.items)).length}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total Items</div>
                 </div>
              </div>
           </div>
           <div className="w-20 h-20 rounded-full bg-[#8DAA81]/20 absolute -right-4 -top-4 blur-3xl" />
           <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <LucideIcons.Package size={40} className="text-white/20" />
           </div>
        </div>
      </section>
    </main>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Store, Plus, Settings2, Check } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'

interface StoreType {
  id: string
  name: string
  _count?: { items: number }
}

interface StoreManagerProps {
  onStoreSelect: (storeId: string | null) => void
  selectedStoreId: string | null
}

export const StoreManager = ({ onStoreSelect, selectedStoreId }: StoreManagerProps) => {
  const { household } = useHousehold()
  const [stores, setStores] = useState<StoreType[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newStoreName, setNewStoreName] = useState('')

  const fetchStores = async () => {
    if (!household) return
    const res = await fetch(`/api/stores?householdId=${household.id}`)
    if (res.ok) setStores(await res.json())
  }

  useEffect(() => {
    fetchStores()
  }, [household])

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStoreName || !household) return

    const res = await fetch('/api/stores', {
      method: 'POST',
      body: JSON.stringify({ name: newStoreName, householdId: household.id })
    })

    if (res.ok) {
      setNewStoreName('')
      setIsAdding(false)
      fetchStores()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-[#2C3A2B]" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-[#2C3A2B]">Stores</h3>
        </div>
        <button 
          onClick={() => onStoreSelect(null)}
          className={`text-[10px] font-black uppercase tracking-widest ${!selectedStoreId ? 'text-[#8DAA81]' : 'text-[#2C3A2B]/40'}`}
        >
          All Items
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-2">
        {stores.map((store) => (
          <div 
            key={store.id}
            onClick={() => onStoreSelect(store.id === selectedStoreId ? null : store.id)}
            className={`min-w-[140px] p-5 rounded-3xl border-none flex flex-col gap-4 relative transition-all cursor-pointer ${
              selectedStoreId === store.id ? 'bg-[#2C3A2B] text-white shadow-xl shadow-[#2C3A2B]/20 scale-105' : 'bg-white/40 text-[#2C3A2B]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedStoreId === store.id ? 'bg-white/10' : 'bg-[#8DAA81]/20 text-[#8DAA81]'}`}>
                <Store size={20} />
              </div>
              {selectedStoreId === store.id && <Check size={16} className="text-[#8DAA81]" />}
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-tight">{store.name}</div>
              <div className={`text-[9px] font-bold uppercase tracking-widest ${selectedStoreId === store.id ? 'text-white/40' : 'text-[#2C3A2B]/40'}`}>
                {store._count?.items || 0} items
              </div>
            </div>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleAddStore} className="min-w-[180px] p-4 rounded-3xl bg-white/60 border-none flex flex-col gap-2">
            <input 
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
              placeholder="Store Name"
              className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-[#2C3A2B] text-white text-[9px] font-black uppercase py-2 rounded-lg">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-2 text-[9px] font-black uppercase text-red-500">X</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="min-w-[140px] p-5 rounded-3xl border-2 border-dashed border-[#2C3A2B]/10 flex flex-col items-center justify-center gap-2 hover:border-[#8DAA81] hover:bg-white/40 transition-all text-[#2C3A2B]/20 hover:text-[#8DAA81]"
          >
            <Plus size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">Add Store</span>
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { ShoppingBag, Plus, ArrowRight } from 'lucide-react'

interface ShoppingBagsProps {
  itemCount: number
}

export const ShoppingBags = ({ itemCount }: ShoppingBagsProps) => {
  return (
    <div className="card p-6 bg-white/40 border-none shadow-sm backdrop-blur-sm group active:scale-[0.98] transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-[#8DAA81] text-white shadow-lg shadow-[#8DAA81]/20">
          <ShoppingBag size={24} />
        </div>
        <button className="p-2 rounded-full bg-white/50 text-[#2C3A2B] hover:bg-white transition-colors">
          <Plus size={20} />
        </button>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-[#2C3A2B] mb-1">Shopping Bags</h3>
          <p className="text-sm font-medium text-[#2C3A2B]/60">
            {itemCount} items to sort
          </p>
        </div>
        <div className="p-2 rounded-full bg-[#2C3A2B] text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} />
        </div>
      </div>
    </div>
  )
}

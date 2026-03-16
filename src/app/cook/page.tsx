'use client'

import React, { useState, useEffect } from 'react'

import { 
  ChefHat, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  UtensilsCrossed, 
  Edit2 
} from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { motion, AnimatePresence } from 'motion/react'

interface MealPlan {
  id: string
  date: string
  slot: string
  recipeName: string | null
  notes: string | null
}

export default function CookHub() {
  const { household, isLoading } = useHousehold()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])

  const fetchMealPlans = async () => {
    if (!household) return
    const res = await fetch(`/api/meal-plans?householdId=${household.id}&date=${selectedDate.toISOString()}`)
    if (res.ok) setMealPlans(await res.json())
  }

  useEffect(() => {
    fetchMealPlans()
  }, [household, selectedDate])

  const handleAddPlan = async (slot: string) => {
    const recipeName = prompt(`What's for ${slot}?`)
    if (!recipeName || !household) return

    await fetch('/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate.toISOString(),
        slot,
        recipeName,
        householdId: household.id
      })
    })
    fetchMealPlans()
  }

  // Mock data for the horizontal carousel
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i - 3)
    return d
  })

  const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

  if (isLoading) return <div className="p-8 text-center text-[#2C3A2B] font-bold">Loading Cook Hub...</div>
  if (!household) return null

  return (
    <main className="container min-h-screen py-8 pb-32">
      <header className="mb-8 px-2">
        <h1 className="text-4xl font-black text-[#2C3A2B] mb-1">Cook Hub</h1>
        <p className="text-[10px] font-black text-[#2C3A2B]/40 uppercase tracking-[0.2em]">OPERATIONS // MEAL_ENGINE</p>
      </header>

      {/* Date Carousel */}
      <section className="mb-10">
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#2C3A2B]" />
            <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#2C3A2B]">Planner // WEEKLY</h2>
          </div>
          <div 
            onClick={() => setSelectedDate(new Date())}
            className="text-[10px] font-black uppercase tracking-widest text-[#8DAA81] cursor-pointer active:scale-90 transition-transform"
          >
            Today
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-6 hide-scrollbar px-2">
          {dates.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString()
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`min-w-[75px] h-28 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  isSelected ? 'bg-[#2C3A2B] text-white shadow-2xl shadow-[#2C3A2B]/30 scale-105' : 'bg-white/40 text-[#2C3A2B]/40'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">
                   {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-3xl font-black">{date.getDate()}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Meal Slots */}
      <section className="space-y-4 px-2">
        {slots.map((slot) => {
          const plan = (mealPlans || []).find((p: MealPlan) => p.slot === slot)
          return (
            <div 
              key={slot} 
              onClick={() => handleAddPlan(slot)}
              className={`card p-6 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer ${
                plan ? 'bg-[#8DAA81] text-white' : 'bg-white/40 border-none'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform active:scale-90 ${plan ? 'bg-white/20' : 'bg-[#8DAA81]/10 text-[#8DAA81]'}`}>
                  <UtensilsCrossed size={24} />
                </div>
                <div>
                  <h3 className={`font-black text-lg ${plan ? 'text-white' : 'text-[#2C3A2B]'}`}>{slot}</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${plan ? 'text-white/60' : 'text-[#2C3A2B]/40'}`}>
                    {plan?.recipeName || 'Nothing planned yet'}
                  </p>
                </div>
              </div>
              <button className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${
                plan ? 'bg-white/20 text-white' : 'bg-white text-[#2C3A2B] opacity-0 group-hover:opacity-100'
              }`}>
                {plan ? <Edit2 size={18} /> : <Plus size={20} />}
              </button>
            </div>
          )
        })}
      </section>

      {/* Diary Teaser */}
      <section className="mt-12 px-2">
        <div className="card bg-[#2C3A2B] p-10 rounded-[3rem] text-white flex justify-between items-center overflow-hidden relative shadow-2xl shadow-[#2C3A2B]/20">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 lowercase tracking-tighter">Kitchen diary</h3>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Review past memories</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white relative z-10 group-hover:bg-white/20 transition-all">
            <ChevronRight size={32} />
          </div>
          {/* Decorative element */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#8DAA81]/10 rounded-full blur-3xl" />
        </div>
      </section>
    </main>
  )
}

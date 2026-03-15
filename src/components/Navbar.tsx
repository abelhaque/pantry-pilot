'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  Package, 
  ShoppingCart, 
  ChefHat
} from 'lucide-react'

export const Navbar = () => {
  const pathname = usePathname()

  const navItems = [
    { label: 'Home', icon: LayoutGrid, href: '/' },
    { label: 'Pantry', icon: Package, href: '/pantry' },
    { label: 'List', icon: ShoppingCart, href: '/shopping-list' },
    { label: 'Cook', icon: ChefHat, href: '/cook' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-black/5 z-50 pb-safe">
      <div className="max-w-md mx-auto px-6 h-20 flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/' && pathname === '')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${
                isActive ? 'text-[#2C3A2B]' : 'text-zinc-400'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#8DAA81]/20' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

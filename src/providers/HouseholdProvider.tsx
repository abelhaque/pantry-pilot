'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Household, Location, Item } from '@/types'
import { useRouter, usePathname } from 'next/navigation'

interface HouseholdContextType {
    household: Household | null
    isLoading: boolean
    refresh: () => Promise<void>
    createLocation: (name: string, type: string) => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextType>({
    household: null,
    isLoading: true,
    refresh: async () => { },
    createLocation: async () => { },
})

export const useHousehold = () => useContext(HouseholdContext)

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
    const [household, setHousehold] = useState<Household | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    const fetchHousehold = async () => {
        try {
            const res = await fetch('/api/init', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()
            if (data.household) {
                setHousehold(data.household)
            } else {
                // Only redirect if absolutely no data and not on auth paths
                const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/auth')
                if (!isAuthPath) {
                    router.push('/login')
                }
            }
        } catch (error) {
            console.error('Failed to fetch household', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchHousehold()
    }, [pathname])

    const createLocation = async (name: string, type: string) => {
        if (!household) return
        await fetch('/api/locations', {
            method: 'POST',
            body: JSON.stringify({ name, type, householdId: household.id })
        })
        await fetchHousehold()
    }

    return (
        <HouseholdContext.Provider value={{ household, isLoading, refresh: fetchHousehold, createLocation }}>
            {children}
        </HouseholdContext.Provider>
    )
}

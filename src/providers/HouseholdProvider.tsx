'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Household, Location, Item } from '@/types'

interface HouseholdContextType {
    household: Household | null
    isLoading: boolean
    refresh: () => Promise<void>
    createLocation: (name: string, icon: string, type: string) => Promise<void>
    createZone: (name: string, locationId: string) => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextType>({
    household: null,
    isLoading: true,
    refresh: async () => { },
    createLocation: async () => { },
    createZone: async () => { },
})

export const useHousehold = () => useContext(HouseholdContext)

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
    const [household, setHousehold] = useState<Household | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refresh = async () => {
        try {
            const res = await fetch('/api/init', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()
            if (res.ok && data.household) {
                // Pre-sanitize location names to ensure string safety in UI
                const sanitized = {
                    ...data.household,
                    locations: (data.household.locations || []).map((l: any) => ({
                        ...l,
                        name: l.name || 'Unnamed Location',
                        zones: (l.zones || []).map((z: any) => ({
                            ...z,
                            name: z.name || 'Unnamed Zone'
                        }))
                    }))
                }
                setHousehold(sanitized)
            } else {
                console.warn('No household returned from /api/init or fetch failed', data)
            }
        } catch (error) {
            console.error('Failed to fetch household:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const createLocation = async (name: string, icon: string, type: string) => {
        if (!household) return
        await fetch('/api/locations', {
            method: 'POST',
            body: JSON.stringify({ name, icon, type, householdId: household.id })
        })
        await refresh()
    }

    const createZone = async (name: string, locationId: string) => {
        await fetch('/api/zones', {
            method: 'POST',
            body: JSON.stringify({ name, locationId })
        })
        await refresh()
    }

    return (
        <HouseholdContext.Provider value={{ household, isLoading, refresh, createLocation, createZone }}>
            {children}
        </HouseholdContext.Provider>
    )
}

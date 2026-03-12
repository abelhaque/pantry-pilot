export interface User {
    id: string
    name: string
    householdId: string | null
}

export interface Household {
    id: string
    name: string
    users: User[]
    locations: Location[]
}

export interface Location {
    id: string
    name: string
    type: string
    householdId: string
    zones: Zone[]
}

export interface Zone {
    id: string
    name: string
    locationId: string
    items: Item[]
}

export interface Item {
    id: string
    name: string
    quantity: number
    unit: string // 'unit', 'g', 'ml', 'L', 'kg'
    category: string
    expiry: string | null // ISO date string
    zoneId: string
}

export interface LibraryItem {
    id: string
    name: string
    category: string
    defaultUnit: string | null
}

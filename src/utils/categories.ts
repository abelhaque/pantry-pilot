export const CATEGORIES = [
    { name: 'Meat', icon: 'Beef' },
    { name: 'Fish', icon: 'Fish' },
    { name: 'Veg', icon: 'LeafyGreen' },
    { name: 'Fruit', icon: 'Apple' },
    { name: 'Dairy', icon: 'Milk' },
    { name: 'Bread', icon: 'Bread' },
    { name: 'Dessert', icon: 'CakeSlice' },
    { name: 'Ready Meal', icon: 'CookingPot' },
    { name: 'Grains', icon: 'Wheat' },
    { name: 'Tins', icon: 'Soup' },
    { name: 'Baking', icon: 'Utensils' },
    { name: 'Sauces', icon: 'Droplet' },
    { name: 'Drinks', icon: 'GlassWater' },
    { name: 'Other', icon: 'Package' },
]

export function getCategoryIcon(catName: string): string {
    const cat = CATEGORIES.find(c => c.name === catName)
    return cat ? cat.icon : '📦'
}

export function getExpiryStatus(expiryDate: string | null | Date): 'safe' | 'warning' | 'expired' | 'none' {
    if (!expiryDate) return 'none'
    const now = new Date()
    const exp = new Date(expiryDate)

    // Set to midnight for comparison
    now.setHours(0, 0, 0, 0)
    exp.setHours(0, 0, 0, 0)

    const diffTime = exp.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'expired'
    if (diffDays <= 3) return 'warning'
    return 'safe'
}

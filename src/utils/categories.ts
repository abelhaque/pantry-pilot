export const CATEGORIES = [
    { name: 'Meat', icon: '🥩' },
    { name: 'Fish', icon: '🐟' },
    { name: 'Veg', icon: '🥦' },
    { name: 'Fruit', icon: '🍎' },
    { name: 'Dairy', icon: '🧀' },
    { name: 'Bread', icon: '🍞' },
    { name: 'Dessert', icon: '🍰' },
    { name: 'Ready Meal', icon: '🍱' },
    { name: 'Grains', icon: '🍝' },
    { name: 'Tins', icon: '🥫' },
    { name: 'Baking', icon: '🥣' },
    { name: 'Sauces', icon: '🍯' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Other', icon: '📦' },
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

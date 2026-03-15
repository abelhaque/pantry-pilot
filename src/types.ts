export interface Household {
  id: string;
  name: string;
  invite_code: string;
}

export interface User {
  id: string;
  email: string;
  household_id: string | null;
  household_name: string | null;
}

export interface Location {
  id: string;
  name: string;
  household_id: string;
  icon?: string;
}

export interface Zone {
  id: string;
  name: string;
  location_id: string;
}

export interface Item {
  id: string;
  name: string;
  storageCategory: string;
  shoppingCategory: string;
  icon: string;
  quantity: number;
  unit_type: string;
  zone_id: string;
  expiry_date: string | null;
  low_stock_threshold: number;
  household_id: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  storageCategory: string;
  shoppingCategory: string;
  icon: string;
  quantity: number;
  unit_type: string;
  store: string | null;
  household_id: string;
  purchased: number;
  item_id: string | null;
}

export interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  name: string;
  ingredients: string; // JSON stringified array of objects { name: string, category: string }
  household_id: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  storageCategory: string;
  shoppingCategory: string;
  icon: string;
  unit_type: string;
  store: string | null;
  household_id: string;
}

export interface PantryState {
  locations: Location[];
  zones: Zone[];
  items: Item[];
  shoppingList: ShoppingItem[];
  library: LibraryItem[];
  mealPlans: MealPlan[];
}

export type Category = 
  | 'Meat' | 'Fish' | 'Veg' | 'Fruit' | 'Dairy' | 'Bakery' 
  | 'Pasta & Grains' | 'Tins & Jars' | 'Baking & Flour' 
  | 'Spices & Seasoning' | 'Sauces & Oils' | 'Snacks' 
  | 'Desserts' | 'Ready Meals' | 'Drinks' | 'Coffee & Tea' 
  | 'Frozen' | 'Cleaning' | 'Personal Care' | 'Household' | 'Pet Care' | 'Other';

export const CATEGORIES: { name: Category; icon: string }[] = [
  { name: 'Meat', icon: '🥩' },
  { name: 'Fish', icon: '🐟' },
  { name: 'Veg', icon: '🥦' },
  { name: 'Fruit', icon: '🍎' },
  { name: 'Dairy', icon: '🧀' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Pasta & Grains', icon: '🍝' },
  { name: 'Tins & Jars', icon: '🥫' },
  { name: 'Baking & Flour', icon: '🥣' },
  { name: 'Spices & Seasoning', icon: '🧂' },
  { name: 'Sauces & Oils', icon: '🍯' },
  { name: 'Snacks', icon: '🥨' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Ready Meals', icon: '🍱' },
  { name: 'Drinks', icon: '🥤' },
  { name: 'Coffee & Tea', icon: '☕' },
  { name: 'Frozen', icon: '❄️' },
  { name: 'Cleaning', icon: '🧼' },
  { name: 'Personal Care', icon: '🧖' },
  { name: 'Household', icon: '🔋' },
  { name: 'Pet Care', icon: '🐾' },
  { name: 'Other', icon: '📦' },
];

export const OFFICIAL_ICONS = [
  { icon: '🌬️', label: 'Fridge', keywords: ['fridge', 'refrigerator', 'chiller'] },
  { icon: '❄️', label: 'Freezer', keywords: ['freezer', 'ice', 'frozen'] },
  { icon: '🥫', label: 'Cupboard', keywords: ['cupboard', 'pantry', 'shelf', 'cabinet', 'larder'] },
  { icon: '🛍️', label: 'Shopping Bags', keywords: ['shopping', 'bags', 'bag', 'cart'] },
  { icon: '🧼', label: 'Bathroom', keywords: ['bathroom', 'toilet', 'shower', 'bath'] },
  { icon: '🛏️', label: 'Bedroom', keywords: ['bedroom', 'bed', 'sleep'] },
  { icon: '🧺', label: 'Utility Room', keywords: ['utility', 'laundry', 'washing', 'cleaning'] },
  { icon: '🍷', label: 'Wine Cellar', keywords: ['wine', 'cellar', 'alcohol', 'drinks'] },
  { icon: '📦', label: 'Other / Garage', keywords: ['other', 'garage', 'box', 'storage', 'shed'] },
  { icon: '🏠', label: 'General Household', keywords: ['general', 'household', 'home', 'house'] }
];

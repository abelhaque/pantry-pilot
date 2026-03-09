import { Category } from '../types';

export function mapOpenFoodFactsCategory(offCategory: string): Category {
  if (!offCategory) return 'Other';
  
  const lowerCat = offCategory.toLowerCase();
  
  if (lowerCat.includes('meat') || lowerCat.includes('beef') || lowerCat.includes('pork') || lowerCat.includes('chicken') || lowerCat.includes('poultry')) return 'Meat';
  if (lowerCat.includes('fish') || lowerCat.includes('seafood')) return 'Fish';
  if (lowerCat.includes('vegetable') || lowerCat.includes('plant-based') || lowerCat.includes('legumes')) return 'Veg';
  if (lowerCat.includes('fruit')) return 'Fruit';
  if (lowerCat.includes('dairy') || lowerCat.includes('milk') || lowerCat.includes('cheese') || lowerCat.includes('yogurt') || lowerCat.includes('butter')) return 'Dairy';
  if (lowerCat.includes('bread') || lowerCat.includes('bakery') || lowerCat.includes('pastries')) return 'Bakery';
  if (lowerCat.includes('pasta') || lowerCat.includes('rice') || lowerCat.includes('cereal') || lowerCat.includes('grain')) return 'Pasta & Grains';
  if (lowerCat.includes('canned') || lowerCat.includes('tinned') || lowerCat.includes('jar')) return 'Tins & Jars';
  if (lowerCat.includes('baking') || lowerCat.includes('flour') || lowerCat.includes('sugar')) return 'Baking & Flour';
  if (lowerCat.includes('spice') || lowerCat.includes('herb') || lowerCat.includes('seasoning')) return 'Spices & Seasoning';
  if (lowerCat.includes('sauce') || lowerCat.includes('oil') || lowerCat.includes('vinegar') || lowerCat.includes('condiment') || lowerCat.includes('dressing')) return 'Sauces & Oils';
  if (lowerCat.includes('snack') || lowerCat.includes('crisp') || lowerCat.includes('chip') || lowerCat.includes('nut')) return 'Snacks';
  if (lowerCat.includes('dessert') || lowerCat.includes('sweet') || lowerCat.includes('chocolate') || lowerCat.includes('candy') || lowerCat.includes('ice cream')) return 'Desserts';
  if (lowerCat.includes('meal') || lowerCat.includes('prepared') || lowerCat.includes('pizza')) return 'Ready Meals';
  if (lowerCat.includes('drink') || lowerCat.includes('beverage') || lowerCat.includes('water') || lowerCat.includes('juice') || lowerCat.includes('soda')) return 'Drinks';
  if (lowerCat.includes('coffee') || lowerCat.includes('tea')) return 'Coffee & Tea';
  if (lowerCat.includes('frozen')) return 'Frozen';
  if (lowerCat.includes('clean') || lowerCat.includes('detergent') || lowerCat.includes('soap')) return 'Cleaning';
  if (lowerCat.includes('care') || lowerCat.includes('beauty') || lowerCat.includes('hygiene') || lowerCat.includes('shampoo')) return 'Personal Care';
  if (lowerCat.includes('household') || lowerCat.includes('paper') || lowerCat.includes('foil')) return 'Household';
  
  return 'Other';
}

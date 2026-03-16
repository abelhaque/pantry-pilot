import { Category } from './categories';

export function mapOpenFoodFactsCategory(offCategory: string): Category {
  if (!offCategory) return 'Other';
  
  const lowerCat = offCategory.toLowerCase();
  
  if (lowerCat.includes('meat') || lowerCat.includes('beef') || lowerCat.includes('pork') || lowerCat.includes('chicken') || lowerCat.includes('poultry')) return 'Meat';
  if (lowerCat.includes('fish') || lowerCat.includes('seafood')) return 'Fish';
  if (lowerCat.includes('vegetable') || lowerCat.includes('plant-based') || lowerCat.includes('legumes')) return 'Veg';
  if (lowerCat.includes('fruit')) return 'Fruit';
  if (lowerCat.includes('dairy') || lowerCat.includes('milk') || lowerCat.includes('cheese') || lowerCat.includes('yogurt') || lowerCat.includes('butter')) return 'Dairy';
  if (lowerCat.includes('bread') || lowerCat.includes('bakery') || lowerCat.includes('pastries')) return 'Bakery';
  if (lowerCat.includes('pasta') || lowerCat.includes('rice') || lowerCat.includes('cereal') || lowerCat.includes('grain')) return 'Grains';
  if (lowerCat.includes('canned') || lowerCat.includes('tinned') || lowerCat.includes('jar')) return 'Tins';
  if (lowerCat.includes('baking') || lowerCat.includes('flour') || lowerCat.includes('sugar')) return 'Baking';
  if (lowerCat.includes('spice') || lowerCat.includes('herb') || lowerCat.includes('seasoning')) return 'Other';
  if (lowerCat.includes('sauce') || lowerCat.includes('oil') || lowerCat.includes('vinegar') || lowerCat.includes('condiment') || lowerCat.includes('dressing')) return 'Sauces';
  if (lowerCat.includes('snack') || lowerCat.includes('crisp') || lowerCat.includes('chip') || lowerCat.includes('nut')) return 'Other';
  if (lowerCat.includes('dessert') || lowerCat.includes('sweet') || lowerCat.includes('chocolate') || lowerCat.includes('candy') || lowerCat.includes('ice cream')) return 'Other';
  if (lowerCat.includes('meal') || lowerCat.includes('prepared') || lowerCat.includes('pizza')) return 'Other';
  if (lowerCat.includes('drink') || lowerCat.includes('beverage') || lowerCat.includes('water') || lowerCat.includes('juice') || lowerCat.includes('soda')) return 'Drinks';
  if (lowerCat.includes('coffee') || lowerCat.includes('tea')) return 'Other';
  if (lowerCat.includes('frozen')) return 'Other';
  if (lowerCat.includes('clean') || lowerCat.includes('detergent') || lowerCat.includes('soap')) return 'Other';
  if (lowerCat.includes('care') || lowerCat.includes('beauty') || lowerCat.includes('hygiene') || lowerCat.includes('shampoo')) return 'Other';
  if (lowerCat.includes('household') || lowerCat.includes('paper') || lowerCat.includes('foil')) return 'Other';
  
  return 'Other';
}

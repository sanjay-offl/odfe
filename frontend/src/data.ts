import type { Category, Product } from './types';
export const categories: Category[] = [
  { id: 'coffee', name: 'Coffee', color: '#C47F3B' }, { id: 'food', name: 'Food', color: '#6B8F71' },
  { id: 'cold', name: 'Cold drinks', color: '#638BA8' }, { id: 'sweet', name: 'Bakery', color: '#B4452F' }
];
export const products: Product[] = [
  { id: '1', name: 'Cappuccino', category: categories[0], price: 4.5, description: 'Double espresso, steamed milk and silky foam', sendToKitchen: true },
  { id: '2', name: 'Flat White', category: categories[0], price: 4.25, description: 'Velvety microfoam over a double ristretto', sendToKitchen: true },
  { id: '3', name: 'Avocado Toast', category: categories[1], price: 9.5, description: 'Sourdough, smashed avocado, lemon and chilli', sendToKitchen: true },
  { id: '4', name: 'Granola Bowl', category: categories[1], price: 8.75, description: 'Greek yoghurt, berries, honey and toasted oats', sendToKitchen: false },
  { id: '5', name: 'Iced Latte', category: categories[2], price: 5, description: 'Chilled espresso with milk over ice', sendToKitchen: false },
  { id: '6', name: 'Cinnamon Bun', category: categories[3], price: 4, description: 'Warm, buttery and freshly baked', sendToKitchen: true }
];

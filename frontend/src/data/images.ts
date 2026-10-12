// Product imagery. Remote photos are used for a premium look; ProductImage falls back to
// a branded gradient + emoji when a network image is unavailable (offline/demo).

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`;

export const PRODUCT_IMAGES: Record<string, string> = {
  cappuccino: U('photo-1572442388796-11668a67e53d'),
  flatwhite: U('photo-1461023058943-07fcbe16d735'),
  espresso: U('photo-1510707577719-ae7c14805e3a'),
  latte: U('photo-1561882468-9110e03e0f78'),
  mocha: U('photo-1578314675249-a6910f80cc4e'),
  coldbrew: U('photo-1517701550927-30cf4ba1dba5'),
  icedlatte: U('photo-1461023058943-07fcbe16d735'),
  matcha: U('photo-1515823064-d6e0c04616a7'),
  greentea: U('photo-1544787219-7f47ccb76574'),
  masalatea: U('photo-1571934811356-5cc061b6821f'),
  lemontea: U('photo-1499638673689-79a0b5115d87'),
  smoothie: U('photo-1505252585461-04db1eb84625'),
  orangejuice: U('photo-1600271886742-f049cd451bba'),
  avocadotoast: U('photo-1541519227354-08fa5d50c44d'),
  granola: U('photo-1517673132405-a56a62b18caf'),
  pancakes: U('photo-1567620905732-2d1ec7ab7445'),
  omelette: U('photo-1510693206972-df098062cb71'),
  sandwich: U('photo-1528735602780-2552fd46c7af'),
  club: U('photo-1553909489-cd47e0907980'),
  paneerwrap: U('photo-1626700051175-6818013e1d4f'),
  burger: U('photo-1568901346375-23c9450c58cd'),
  pizza: U('photo-1513104890138-7c749659a591'),
  salad: U('photo-1512621776951-a57141f2eefd'),
  soup: U('photo-1547592166-23ac45744acd'),
  croissant: U('photo-1555507036-ab1f4038808a'),
  muffin: U('photo-1607958996333-41aef7caefaa'),
  bagel: U('photo-1551024601-bec78aea704b'),
  brownie: U('photo-1606313564200-e75d5e30476c'),
  cheesecake: U('photo-1533134242443-d4fd215305ad'),
  cake: U('photo-1578985545062-69928b1d9587'),
  donut: U('photo-1551024506-0bccd828d307'),
  cookies: U('photo-1499636136210-6f4ee915583e'),
  waffle: U('photo-1562376552-0d160a2f238d'),
  water: U('photo-1523362628745-0c100150b504'),
  soda: U('photo-1581006852262-e4307cf6283a'),
};

export const CATEGORY_FALLBACK: Record<string, string> = {
  Coffee: '☕',
  Tea: '🍵',
  'Cold Drinks': '🧊',
  Breakfast: '🍳',
  Sandwiches: '🥪',
  Mains: '🍽️',
  Bakery: '🥐',
  Desserts: '🍰',
  Snacks: '🍟',
};

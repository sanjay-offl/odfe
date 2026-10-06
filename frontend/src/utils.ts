export const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export const readableText = (hex: string) => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 155 ? '#2B1B14' : '#fff';
};

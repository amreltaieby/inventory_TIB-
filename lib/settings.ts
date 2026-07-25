export function getLowStockMultiplier(): number {
  if (typeof window === 'undefined') return 1.25;
  const stored = localStorage.getItem('lowStockMultiplier');
  return stored ? Number(stored) : 1.25;
}

export function setLowStockMultiplier(value: number) {
  localStorage.setItem('lowStockMultiplier', String(value));
}
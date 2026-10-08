export function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(amount);
}





export function formatINR(value) {
  const rupees = Number(value || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

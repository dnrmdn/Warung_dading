export function formatRupiah(amount?: number): string {
  if (amount === undefined || amount === null) {
    return '-';
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatCompactRupiah(amount?: number): string {
  if (amount === undefined || amount === null) {
    return '-';
  }
  if (amount >= 1000000) {
    const formatted = (amount / 1000000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${formatted}jt`;
  }
  if (amount >= 1000) {
    const formatted = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1).replace(/\.0$/, '');
    return `Rp ${formatted}k`;
  }
  return `Rp ${amount}`;
}

export function formatPriceOnly(amount?: number): string {
  if (amount === undefined || amount === null) {
    return '-';
  }
  if (amount >= 1000) {
    const formatted = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return `${amount}`;
}

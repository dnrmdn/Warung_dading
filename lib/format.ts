export function formatRupiah(amount?: number): string {
  if (amount === undefined || amount === null) {
    return '-';
  }
  return `Rp${amount.toLocaleString('id-ID')}`;
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

/**
 * Formats a margin percentage to 1 decimal place.
 * Examples: 10 -> "10.0%", 38.066... -> "38.1%", undefined/null/NaN -> "-"
 */
export function formatMargin(percent?: number | null): string {
  if (percent === undefined || percent === null || Number.isNaN(percent)) {
    return '-';
  }
  return `${percent.toFixed(1)}%`;
}

import { formatRupiah } from '@/lib/format';

export interface PublicCartItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  iconName?: string;
}

/**
 * Normalizes phone number to digits only (e.g., '0812...' or '+62812...' -> '62812...').
 * If starts with '08', converts to Indonesian international prefix '628'.
 */
export function normalizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('08')) {
    return `628${digits.slice(2)}`;
  }
  return digits;
}

/**
 * Builds the exact customer order message for WhatsApp.
 * Starts with: "Halo kak saya mau order barang:\n"
 */
export function formatWhatsAppOrderMessage(
  items: PublicCartItem[],
  totalAmount: number
): string {
  const lines: string[] = ['Halo kak saya mau order barang:'];

  const allItemsHavePrice = items.length > 0 && items.every((item) => item.unitPrice > 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  items.forEach((item, index) => {
    if (item.unitPrice > 0) {
      const subtotal = item.unitPrice * item.quantity;
      lines.push(
        `\n${index + 1}. ${item.name}\n   • ${item.quantity} ${item.unit} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(subtotal)}`
      );
    } else {
      lines.push(`\n${index + 1}. ${item.name}\n   • ${item.quantity} ${item.unit}`);
    }
  });

  if (allItemsHavePrice) {
    lines.push(`\n\nTotal Pesanan: ${formatRupiah(totalAmount)} (${totalCount} item)`);
    lines.push('\nMohon konfirmasi ketersediaan barang dan total pembayarannya. Terima kasih!');
  } else {
    lines.push(`\n\nTotal Item: ${totalCount} barang`);
    lines.push('\nMohon konfirmasi ketersediaan barang dan harganya ya kak. Terima kasih!');
  }

  return lines.join('');
}

/**
 * Generates the safe, URL-encoded WhatsApp link or returns null if no valid number.
 */
export function getWhatsAppOrderUrl(
  phone: string | undefined | null,
  items: PublicCartItem[],
  totalAmount: number
): string | null {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  if (!normalizedPhone) {
    return null;
  }

  const message = formatWhatsAppOrderMessage(items, totalAmount);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

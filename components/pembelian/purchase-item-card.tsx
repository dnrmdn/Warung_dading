'use client';

import React from 'react';
import { Purchase } from '@/types/warung';
import { formatRupiah } from '@/lib/format';
import { ChevronRight, Store } from 'lucide-react';

interface PurchaseItemCardProps {
  purchase: Purchase;
  onClick: (purchase: Purchase) => void;
}

function formatPurchaseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildItemPreview(purchase: Purchase): string {
  const MAX_PREVIEW = 2;
  const preview = purchase.items.slice(0, MAX_PREVIEW).map(
    (item) => `${item.productName} (x${item.quantity})`
  );
  const extra = purchase.items.length - MAX_PREVIEW;
  if (extra > 0) {
    preview.push(`+${extra} lainnya`);
  }
  return preview.join(', ');
}

export function PurchaseItemCard({ purchase, onClick }: PurchaseItemCardProps) {
  const itemCount = purchase.items.length;
  const supplierLabel = purchase.supplierName?.trim() || 'Tanpa Supplier';
  const preview = buildItemPreview(purchase);

  return (
    <button
      type="button"
      onClick={() => onClick(purchase)}
      className="w-full text-left flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border/80 hover:border-primary/40 hover:shadow-2xs active:scale-[0.99] transition-all group"
      aria-label={`Lihat detail pembelian ${purchase.id}`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft text-primary shrink-0">
        <Store className="w-4 h-4 stroke-[1.8]" />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Date */}
        <span className="text-body-medium font-semibold text-text truncate block">
          {formatPurchaseDate(purchase.purchaseDate)}
        </span>

        {/* Row 2: Supplier + item count */}
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <span className="text-caption text-text-secondary truncate">
            {supplierLabel}
          </span>
          <span className="text-caption text-text-muted shrink-0">·</span>
          <span className="text-caption text-text-muted shrink-0">
            {itemCount} {itemCount === 1 ? 'barang' : 'macam barang'}
          </span>
        </div>

        {/* Row 3: Item preview */}
        <p className="text-caption text-text-muted mt-0.5 truncate">
          {preview}
        </p>
      </div>

      {/* Total + Chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-body-medium font-bold text-text group-hover:text-primary transition-colors">
          {formatRupiah(purchase.totalAmount)}
        </span>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

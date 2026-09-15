'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/warung';
import { ProductIcon } from '@/components/ui/product-icon';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface StockItemRowProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function StockItemRow({ product, onEdit, onAdjustStock, onDelete }: StockItemRowProps) {
  const isLowStock = product.stock <= product.minStock;
  const isOutOfStock = product.stock === 0;

  const inventoryTypeLabel = {
    barang: 'Barang',
    bahan: 'Bahan',
    produk_jadi: 'Produk Jadi',
  }[product.inventoryType];

  return (
    <div className="w-full flex items-center justify-between p-3 bg-surface rounded-xl border border-border/80 hover:border-primary/50 hover:shadow-2xs transition-all gap-2 group">
      {/* Product Details Area (Clickable Link to Product Detail) */}
      <Link
        href={`/produk/${product.id}`}
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-subtle text-primary shrink-0 border border-border/60">
          <ProductIcon name={product.iconName} className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-body-medium font-medium text-text truncate">
              {product.name}
            </h4>
            <Badge variant="default" className="text-[10px] py-0 px-1.5">
              {inventoryTypeLabel}
            </Badge>
          </div>

          {(() => {
            const derivedHpp =
              product.hppComponents && product.hppComponents.length > 0
                ? product.hppComponents.reduce(
                    (sum, c) => sum + c.quantity * c.unitCost,
                    0
                  )
                : product.costPrice;

            return (
              <div className="flex items-center gap-2 mt-0.5 text-caption text-text-secondary">
                <span>{formatRupiah(product.price)}</span>
                {derivedHpp !== undefined && (
                  <>
                    <span>•</span>
                    <span>HPP {formatRupiah(derivedHpp)}</span>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </Link>

      {/* Stock Quantity & Status & Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/*
          Clickable stock badge — tapping it opens Stock Adjustment.
          This is the single trigger for stock adjustment; no separate
          icon button needed, keeping the right panel compact.
        */}
        <button
          type="button"
          onClick={() => onAdjustStock?.(product)}
          className="flex flex-col items-end px-2 py-1 rounded-lg hover:bg-surface-subtle active:scale-95 transition-all text-right group/stock"
          aria-label={`Sesuaikan stok ${product.name}`}
          title="Klik untuk sesuaikan stok"
        >
          <span className="text-body-medium font-semibold text-text group-hover/stock:text-primary transition-colors">
            {product.stock}{' '}
            <span className="text-caption font-normal text-text-muted">
              {product.unit}
            </span>
          </span>

          {isOutOfStock ? (
            <Badge variant="danger" className="text-[9px] mt-0.5">
              Habis
            </Badge>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning mt-0.5">
              <AlertTriangle className="w-3 h-3" />
              Menipis
            </span>
          ) : (
            <span className="text-[10px] text-success font-medium mt-0.5">
              Aman
            </span>
          )}
        </button>

        {/* Edit Product + Delete + Navigate to detail */}
        <div className="flex items-center gap-0.5 pl-0.5 border-l border-border/60">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-primary hover:bg-surface-subtle active:scale-95 transition-all"
              aria-label={`Edit produk ${product.name}`}
              title="Edit master data produk"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft/30 active:scale-95 transition-all"
              aria-label={`Hapus produk ${product.name}`}
              title="Hapus produk"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            href={`/produk/${product.id}`}
            className="flex items-center justify-center w-6 h-7 text-text-muted hover:text-text"
            aria-label={`Detail produk ${product.name}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductIcon } from '@/components/ui/product-icon';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PublicProduct } from '@/lib/services/public-products';

interface PublicStockItemProps {
  product: PublicProduct;
  quantityInCart: number;
  onSelect: (product: PublicProduct) => void;
}

export function PublicStockItem({
  product,
  quantityInCart,
  onSelect,
}: PublicStockItemProps) {
  const isOutOfStock = product.stock <= 0;
  const hasValidPrice =
    product.price !== null && product.price !== undefined && product.price > 0;
  const isSelected = quantityInCart > 0;
  const canAddToCart = !isOutOfStock && hasValidPrice;

  // Track image load errors to fallback to ProductIcon
  const [imgError, setImgError] = useState(false);
  const hasImage = !!product.imageUrl && !imgError;

  const handleClick = () => {
    if (!canAddToCart) return;
    onSelect(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canAddToCart}
      className={cn(
        'group relative flex w-full min-w-0 max-w-full flex-col items-center justify-between box-border p-2 rounded-xl bg-surface border transition-all text-center select-none min-h-[140px] overflow-hidden',
        isOutOfStock
          ? 'border-border/60 bg-surface/60 opacity-75 cursor-not-allowed'
          : !hasValidPrice
          ? 'border-border/70 bg-surface/80 opacity-85 cursor-not-allowed'
          : isSelected
          ? 'border-primary ring-1 ring-primary/40 bg-primary-soft/10 shadow-xs cursor-pointer active:scale-95'
          : 'border-border/80 hover:border-primary/60 hover:shadow-xs cursor-pointer active:scale-95'
      )}
    >
      {/* Top-Right Badge: Active Cart Quantity (if selected) or Stock / Habis badge */}
      {isSelected ? (
        <span
          className="absolute top-1 right-1 z-10 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold shadow-xs leading-none"
          title={`Dipilih: ${quantityInCart}`}
        >
          {quantityInCart}
        </span>
      ) : isOutOfStock ? (
        <span
          className="absolute top-1 right-1 z-10 flex items-center justify-center px-1.5 h-4 rounded-full bg-danger-soft text-danger border border-danger/25 text-[8px] font-bold shadow-xs leading-none"
          title="Habis"
        >
          Habis
        </span>
      ) : (
        <span
          className="absolute top-1 right-1 z-10 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-surface-subtle text-text border border-border text-[9px] font-bold shadow-xs leading-none"
          title={`Sisa stok: ${product.stock}`}
        >
          {product.stock}
        </span>
      )}

      {/* Product Image or Icon (prominent square ~64x64px) */}
      <div className="flex items-center justify-center w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-surface-subtle/50 mb-1.5 mt-0.5">
        {hasImage ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            width={64}
            height={64}
            className="w-full h-full rounded-lg object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="text-primary/80 group-hover:text-primary transition-colors flex items-center justify-center">
            <ProductIcon name={product.iconName} className="w-8 h-8 stroke-[1.8]" />
          </div>
        )}
      </div>

      {/* Product Name (clamped to 2 lines, readable ~12px) */}
      <span
        className="text-[12px] font-semibold text-text leading-[14px] line-clamp-2 w-full min-w-0 max-w-full break-words shrink mb-1"
        title={product.name}
      >
        {product.name}
      </span>

      {/* Bottom price slot: Customer selling price (Rp1.000) or 'Harga hubungi staf' or 'Habis' */}
      <span
        className={cn(
          'text-[12px] leading-tight truncate w-full min-w-0 max-w-full font-bold shrink-0',
          isOutOfStock
            ? 'text-danger font-medium'
            : hasValidPrice
            ? 'text-primary'
            : 'text-text-muted font-normal text-[10px]'
        )}
      >
        {isOutOfStock
          ? 'Habis'
          : hasValidPrice
          ? formatRupiah(product.price!)
          : 'Hubungi staf'}
      </span>
    </button>
  );
}

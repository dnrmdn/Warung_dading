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
        'group relative flex w-full min-w-0 max-w-full flex-col items-center justify-between box-border p-1 rounded-md bg-surface border transition-all text-center select-none min-h-[64px] max-h-[74px] overflow-hidden',
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
          className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-white text-[8px] font-bold shadow-xs leading-none"
          title={`Dipilih: ${quantityInCart}`}
        >
          {quantityInCart}
        </span>
      ) : isOutOfStock ? (
        <span
          className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center px-1 h-3 rounded-full bg-danger-soft text-danger border border-danger/25 text-[7px] font-bold shadow-xs leading-none"
          title="Habis"
        >
          Habis
        </span>
      ) : (
        <span
          className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-surface-subtle text-text border border-border text-[8px] font-bold shadow-xs leading-none"
          title={`Sisa stok: ${product.stock}`}
        >
          {product.stock}
        </span>
      )}

      {/* Product Image or Icon (compact 20px) */}
      <div className="flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden">
        {hasImage ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            width={20}
            height={20}
            className="w-5 h-5 rounded-xs object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="text-primary/80 group-hover:text-primary transition-colors">
            <ProductIcon name={product.iconName} className="w-4 h-4 stroke-[1.8]" />
          </div>
        )}
      </div>

      {/* Product Name (clamped to 2 lines, shrinkable) */}
      <span
        className="text-[10px] font-medium text-text leading-[11px] line-clamp-2 w-full min-w-0 max-w-full break-words shrink"
        title={product.name}
      >
        {product.name}
      </span>

      {/* Bottom price slot: Customer selling price (Rp1.000) or 'Harga hubungi staf' or 'Habis' */}
      <span
        className={cn(
          'text-[9px] leading-tight truncate w-full min-w-0 max-w-full font-semibold shrink-0',
          isOutOfStock
            ? 'text-danger font-medium'
            : hasValidPrice
            ? 'text-primary'
            : 'text-text-muted font-normal text-[8px]'
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

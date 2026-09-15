'use client';

import React from 'react';
import { Product } from '@/types/warung';
import { ProductIcon } from '@/components/ui/product-icon';
import { formatPriceOnly } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProductTileProps {
  product: Product;
  quantityInCart: number;
  onSelect: (product: Product) => void;
}

export function ProductTile({
  product,
  quantityInCart,
  onSelect,
}: ProductTileProps) {
  const isSelected = quantityInCart > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        'group relative flex w-full min-w-0 max-w-full flex-col items-center justify-between box-border p-1 rounded-lg bg-surface border transition-all text-center select-none active:scale-95 min-h-[68px] sm:min-h-[76px]',
        isSelected
          ? 'border-primary ring-1 ring-primary/40 bg-primary-soft/10 shadow-xs'
          : 'border-border/80 hover:border-primary/60 hover:shadow-xs'
      )}
    >
      {/* Active Quantity Badge */}
      {isSelected && (
        <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold shadow-xs">
          {quantityInCart}
        </span>
      )}

      {/* Product Icon (20-24px) */}
      <div className="flex items-center justify-center w-6 h-6 text-primary/80 group-hover:text-primary transition-colors mt-0.5">
        <ProductIcon name={product.iconName} className="w-5 h-5 stroke-[1.8]" />
      </div>

      {/* Product Name (11-12px, clamped) */}
      <span className="text-[11px] font-medium text-text leading-[12px] line-clamp-2 w-full break-words my-0.5">
        {product.name}
      </span>

      {/* Price (11-12px) */}
      <span className="text-[11px] font-semibold text-primary leading-tight">
        {formatPriceOnly(product.price)}
      </span>
    </button>
  );
}

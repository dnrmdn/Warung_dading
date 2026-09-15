'use client';

import React from 'react';
import { Product, SellingMode } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import { ProductIcon } from '@/components/ui/product-icon';
import { ShoppingBag, Coffee } from 'lucide-react';

interface SellingModeSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (product: Product, mode: SellingMode) => void;
}

export function SellingModeSheet({
  product,
  isOpen,
  onClose,
  onSelectMode,
}: SellingModeSheetProps) {
  if (!product) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Mode Jual"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Product summary */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-subtle border border-border/80">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border text-primary">
            <ProductIcon name={product.iconName} className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-body-medium font-semibold text-text truncate">
              {product.name}
            </h4>
            <p className="text-caption text-text-secondary">
              Kategori: {product.category}
            </p>
          </div>
        </div>

        {/* Mode Options: Jual Langsung vs Diseduh */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Option 1: Jual Langsung */}
          <button
            type="button"
            onClick={() => onSelectMode(product, 'direct')}
            className="flex flex-col items-start p-3 rounded-xl bg-surface border border-border hover:border-primary active:scale-98 transition-all text-left shadow-2xs group"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="p-1.5 rounded-lg bg-surface-subtle text-text-secondary group-hover:text-primary group-hover:bg-primary-soft/30 transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="text-caption font-semibold text-text-muted">Mentah</span>
            </div>
            <span className="text-body-medium font-semibold text-text">
              Jual langsung
            </span>
            <span className="text-small font-semibold text-primary mt-1">
              {formatRupiah(product.price)}
            </span>
          </button>

          {/* Option 2: Diseduh / Masak */}
          <button
            type="button"
            onClick={() => onSelectMode(product, 'brewed')}
            className="flex flex-col items-start p-3 rounded-xl bg-surface border border-border hover:border-primary active:scale-98 transition-all text-left shadow-2xs group"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="p-1.5 rounded-lg bg-surface-subtle text-text-secondary group-hover:text-primary group-hover:bg-primary-soft/30 transition-colors">
                <Coffee className="w-4 h-4" />
              </span>
              <span className="text-caption font-semibold text-primary">Siap Saji</span>
            </div>
            <span className="text-body-medium font-semibold text-text">
              Diseduh
            </span>
            <span className="text-small font-semibold text-primary mt-1">
              {formatRupiah(product.preparedPrice ?? product.price)}
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

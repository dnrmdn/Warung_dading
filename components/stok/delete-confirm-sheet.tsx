'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Product } from '@/types/warung';
import { ProductIcon } from '@/components/ui/product-icon';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: () => void;
}

export function DeleteConfirmSheet({
  isOpen,
  onClose,
  product,
  onConfirm,
}: DeleteConfirmSheetProps) {
  // Guard: do not render content without a product target
  if (!product) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Hapus Produk">
      <div className="flex flex-col gap-4 pb-4">
        {/* Destructive Icon Block */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-soft border border-danger/30 text-danger">
            <Trash2 className="w-7 h-7" />
          </div>
          <h3 className="text-body-medium font-semibold text-text">
            Hapus produk ini?
          </h3>
        </div>

        {/* Product Identity Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-subtle border border-border/70">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface text-primary shrink-0 border border-border/60">
            <ProductIcon name={product.iconName} className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-body-medium font-semibold text-text truncate">
              {product.name}
              {product.variant ? (
                <span className="font-normal text-text-secondary">
                  {' '}— {product.variant}
                </span>
              ) : null}
            </p>
            <p className="text-caption text-text-secondary truncate mt-0.5">
              {product.family} • {product.category}
            </p>
          </div>
        </div>

        {/* Warning Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning-soft border border-warning/30 text-warning">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-small leading-snug">
            <span className="font-semibold">Tindakan ini permanen</span> dan
            tidak dapat dibatalkan. Data produk akan dihapus dari daftar stok.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-subtle text-small font-medium transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-danger text-white font-semibold text-small hover:bg-danger/90 active:scale-98 transition-all shadow-sm"
          >
            Hapus Produk
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

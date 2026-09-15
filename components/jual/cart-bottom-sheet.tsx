'use client';

import React from 'react';
import { CartItem } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import { ProductIcon } from '@/components/ui/product-icon';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartBottomSheet({
  isOpen,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClearCart,
  onCheckout,
}: CartBottomSheetProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Keranjang Penjualan (${totalQuantity} item)`}
    >
      <div className="flex flex-col gap-3 py-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-text-secondary">
            <p className="text-body">Keranjang masih kosong.</p>
            <p className="text-caption text-text-muted mt-1">
              Tap produk pada grid untuk menambahkan ke keranjang.
            </p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex flex-col divide-y divide-border/60 max-h-[45vh] overflow-y-auto -mx-1 px-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 gap-2"
                >
                  {/* Left info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle text-primary shrink-0">
                      <ProductIcon name={item.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-body-medium font-medium text-text truncate">
                          {item.name}
                        </span>
                        {item.mode === 'brewed' && (
                          <Badge variant="primary">Diseduh</Badge>
                        )}
                      </div>
                      <span className="text-caption text-text-secondary">
                        {formatRupiah(item.unitPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDecrement(item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-subtle border border-border text-text hover:bg-border active:scale-95 transition-all"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-body-medium font-semibold text-text">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-subtle border border-border text-text hover:bg-border active:scale-95 transition-all"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft/30 transition-all ml-1"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Footer */}
            <div className="pt-3 border-t border-border flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Total Bayar</span>
                <span className="text-h2 font-bold text-text">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="px-3 py-2.5 rounded-xl border border-border text-text-secondary hover:text-danger hover:border-danger/40 text-small font-medium transition-all"
                >
                  Kosongkan
                </button>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-body-medium hover:bg-primary-dark active:scale-98 transition-all shadow-sm"
                >
                  Selesaikan Penjualan
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

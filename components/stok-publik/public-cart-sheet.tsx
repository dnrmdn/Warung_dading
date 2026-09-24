'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ProductIcon } from '@/components/ui/product-icon';
import { formatRupiah } from '@/lib/format';
import type { PublicCartItem } from '@/lib/whatsapp';
import { Plus, Minus, Trash2, MessageCircle, AlertCircle } from 'lucide-react';

interface PublicCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: PublicCartItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  totalCount: number;
  totalAmount: number;
  whatsAppUrl: string | null;
  hasWhatsAppNumber: boolean;
}

export function PublicCartSheet({
  isOpen,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  totalCount,
  totalAmount,
  whatsAppUrl,
  hasWhatsAppNumber,
}: PublicCartSheetProps) {
  const allItemsHavePrice = items.length > 0 && items.every((item) => item.unitPrice > 0);

  const handleWhatsAppClick = () => {
    if (!whatsAppUrl) return;
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Keranjang Belanja">
      <div className="flex flex-col gap-4 pb-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-body font-medium text-text">Keranjang masih kosong</p>
            <p className="text-caption text-text-muted mt-1">
              Silakan pilih barang yang ingin dipesan dari katalog.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-xl bg-surface-subtle text-small font-semibold text-text hover:bg-surface-subtle/80"
            >
              Kembali Belanja
            </button>
          </div>
        ) : (
          <>
            {/* Header action: Clear Cart */}
            <div className="flex items-center justify-between px-1">
              <span className="text-caption text-text-secondary font-medium">
                {totalCount} barang dipilih
              </span>
              <button
                type="button"
                onClick={onClear}
                className="text-caption text-danger hover:underline font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            </div>

            {/* Items List */}
            <div className="flex flex-col divide-y divide-border/60 max-h-[50dvh] overflow-y-auto pr-1">
              {items.map((item) => {
                const isMax = item.quantity >= item.stock;
                const subtotal = item.unitPrice * item.quantity;

                return (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                    {/* Item info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-surface-subtle text-primary/80 flex items-center justify-center shrink-0">
                        <ProductIcon name={item.iconName} className="w-4 h-4 stroke-[1.8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-small font-medium text-text block truncate">
                          {item.name}
                        </span>
                        <span className="text-caption text-text-secondary block">
                          {item.unitPrice > 0 ? (
                            <>
                              {formatRupiah(item.unitPrice)} / {item.unit}
                            </>
                          ) : (
                            <span className="text-text-muted">Harga hubungi staf</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-surface-subtle border border-border/80 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onDecrement(item.productId)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface active:scale-90 text-text transition-all"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-3 h-3 stroke-[2.2]" />
                        </button>
                        <span className="w-6 text-center text-caption font-bold text-text">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrement(item.productId)}
                          disabled={isMax}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface active:scale-90 text-text disabled:opacity-30 disabled:pointer-events-none transition-all"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="w-3 h-3 stroke-[2.2]" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.productId)}
                        className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-surface-subtle transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Summary */}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-body font-bold text-text">
                <span>{allItemsHavePrice ? 'Estimasi Total' : 'Total Barang'}</span>
                <span>
                  {allItemsHavePrice ? formatRupiah(totalAmount) : `${totalCount} item`}
                </span>
              </div>
              {!allItemsHavePrice && (
                <p className="text-[11px] text-text-muted">
                  *Sebagian item belum memiliki harga tetap. Total akhir akan dikonfirmasi staf via WhatsApp.
                </p>
              )}
            </div>

            {/* WhatsApp Ordering Action */}
            <div className="pt-1">
              {hasWhatsAppNumber ? (
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-semibold text-small flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current stroke-none" />
                  <span>
                    Pesan via WhatsApp
                    {allItemsHavePrice && totalAmount > 0 ? ` · ${formatRupiah(totalAmount)}` : ''}
                  </span>
                </button>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-caption">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Nomor WhatsApp pemesanan belum dikonfigurasi. Silakan hubungi kasir secara langsung di warung.
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

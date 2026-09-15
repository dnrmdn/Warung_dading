'use client';

import React from 'react';
import { Purchase } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import { CalendarDays, Store, FileText, Package, CheckCircle2 } from 'lucide-react';

interface PurchaseDetailSheetProps {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPurchaseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PurchaseDetailSheet({
  purchase,
  open,
  onOpenChange,
}: PurchaseDetailSheetProps) {
  return (
    <BottomSheet
      isOpen={open && purchase !== null}
      onClose={() => onOpenChange(false)}
      title="Detail Pembelian"
    >
      {purchase && (
        <div className="flex flex-col gap-4 pb-4">

          {/* --- Transaction Header Info --- */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface-subtle border border-border/60">
            {/* Purchase ID */}
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-caption text-text-secondary block">No. Transaksi</span>
                <span className="text-small font-medium text-text break-all">{purchase.id}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-caption text-text-secondary block">Tanggal Pembelian</span>
                <span className="text-small font-medium text-text">
                  {formatPurchaseDate(purchase.purchaseDate)}
                </span>
              </div>
            </div>

            {/* Supplier */}
            <div className="flex items-start gap-2">
              <Store className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-caption text-text-secondary block">Supplier / Toko</span>
                <span className="text-small font-medium text-text">
                  {purchase.supplierName?.trim() || (
                    <span className="text-text-muted italic">Tanpa Supplier</span>
                  )}
                </span>
              </div>
            </div>

            {/* Note (conditional) */}
            {purchase.note && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-caption text-text-secondary block">Catatan</span>
                  <span className="text-small text-text">{purchase.note}</span>
                </div>
              </div>
            )}
          </div>

          {/* --- Items Table --- */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-0.5">
              <Package className="w-4 h-4 text-text-muted" />
              <h4 className="text-small font-semibold text-text-secondary uppercase tracking-wide">
                Daftar Barang
              </h4>
            </div>

            <div className="flex flex-col gap-0 rounded-xl border border-border overflow-hidden">
              {/* Header Row */}
              <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-surface-subtle border-b border-border/60">
                <span className="text-caption font-semibold text-text-secondary">Produk</span>
                <span className="text-caption font-semibold text-text-secondary text-right">Subtotal</span>
              </div>

              {/* Item Rows */}
              {purchase.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={[
                    'grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 bg-surface',
                    idx < purchase.items.length - 1 ? 'border-b border-border/50' : '',
                  ].join(' ')}
                >
                  {/* Left: product name + qty detail */}
                  <div className="min-w-0">
                    <span className="text-small font-medium text-text block truncate">
                      {item.productName}
                    </span>
                    <span className="text-caption text-text-muted">
                      {item.quantity} {item.unit} × {formatRupiah(item.unitCost)}
                    </span>
                  </div>

                  {/* Right: subtotal */}
                  <span className="text-small font-semibold text-text text-right shrink-0 self-center">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}

              {/* Total Row */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-primary-soft/30 border-t border-primary/20">
                <span className="text-small font-bold text-primary">Total Pembelian</span>
                <span className="text-body-medium font-bold text-primary">
                  {formatRupiah(purchase.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* --- Stock Confirmation Info --- */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-success-soft/40 border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <p className="text-caption text-success leading-snug">
              Stok bertambah sesuai barang yang dibeli. Riwayat penyesuaian stok telah dicatat secara otomatis.
            </p>
          </div>

        </div>
      )}
    </BottomSheet>
  );
}

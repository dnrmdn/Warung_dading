'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/format';
import { Sale, PaymentStatus } from '@/types/warung';
import { ShoppingBag, User, Phone, Receipt, CreditCard, Clock, Calendar, Loader2 } from 'lucide-react';

interface TransaksiDetailSheetProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

function formatStatus(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', variant: 'success' as const };
    case 'partial':
      return { label: 'Sebagian', variant: 'warning' as const };
    case 'unpaid':
      return { label: 'Belum Bayar', variant: 'danger' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function TransaksiDetailSheet({
  sale,
  isOpen,
  onClose,
  isLoading,
}: TransaksiDetailSheetProps) {
  if (!sale) return null;

  const statusInfo = formatStatus(sale.paymentStatus);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Detail Transaksi">
      <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(85dvh-60px)] pb-8">
        {/* Header Information */}
        <div className="bg-surface-subtle p-3.5 rounded-xl border border-border flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-small font-semibold text-text">
                {sale.transactionNumber}
              </span>
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              )}
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <div className="flex items-center gap-4 text-caption text-text-secondary">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span>{formatDate(sale.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span>{formatTime(sale.createdAt)} WIB</span>
            </div>
          </div>
        </div>

        {/* Customer Information (if exists) */}
        {(sale.customerName || sale.customerPhone) && (
          <div className="flex flex-col gap-1.5 p-3 bg-surface-subtle rounded-xl border border-border">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Informasi Pelanggan
            </span>
            <div className="flex flex-col gap-1 mt-0.5">
              {sale.customerName && (
                <div className="flex items-center gap-2 text-small text-text">
                  <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="font-medium">{sale.customerName}</span>
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex items-center gap-2 text-small text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Daftar Barang ({sale.items.length})
            </span>
          </div>

          <div className="divide-y divide-border/60 border border-border rounded-xl bg-surface overflow-hidden">
            {sale.items.map((item) => (
              <div key={item.id} className="p-3 flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-small font-medium text-text truncate">
                      {item.productName}
                    </span>
                    {item.mode === 'brewed' ? (
                      <Badge variant="primary">Diseduh</Badge>
                    ) : (
                      <Badge variant="default">Mentah</Badge>
                    )}
                  </div>
                  <span className="text-caption text-text-muted">
                    {item.quantity} {item.unit} × {formatRupiah(item.unitPrice)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-small font-semibold text-text">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="flex flex-col gap-2 p-3.5 bg-surface-subtle rounded-xl border border-border">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" />
            Rincian Pembayaran
          </span>

          <div className="flex flex-col gap-1.5 text-small mt-1">
            <div className="flex justify-between text-text-secondary">
              <span>Metode</span>
              <span className="font-medium capitalize text-text">Tunai (Cash)</span>
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>Total Belanja</span>
              <span className="font-semibold text-text">{formatRupiah(sale.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>Dibayar</span>
              <span className="font-medium text-text">{formatRupiah(sale.paymentAmount)}</span>
            </div>

            {sale.changeAmount > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Kembalian</span>
                <span className="font-medium text-success">{formatRupiah(sale.changeAmount)}</span>
              </div>
            )}

            {sale.amountDue > 0 && (
              <div className="flex justify-between text-text-secondary pt-1 border-t border-border">
                <span className="text-danger font-medium">Sisa Piutang</span>
                <span className="font-bold text-danger">{formatRupiah(sale.amountDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Receivable Payment History (if any) */}
        {sale.receivablePayments && sale.receivablePayments.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              Riwayat Pembayaran Piutang ({sale.receivablePayments.length})
            </span>

            <div className="divide-y divide-border/60 border border-border rounded-xl bg-surface overflow-hidden">
              {sale.receivablePayments.map((rp) => (
                <div key={rp.id} className="p-3 flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-small font-medium text-text">
                      {formatRupiah(rp.amount)}
                    </span>
                    <span className="text-caption text-text-muted">
                      {formatDate(rp.paidAt)} • {formatTime(rp.paidAt)} WIB
                    </span>
                    {rp.note && (
                      <span className="text-caption italic text-text-secondary mt-0.5">
                        &quot;{rp.note}&quot;
                      </span>
                    )}
                  </div>
                  <Badge variant="success">Diterima</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

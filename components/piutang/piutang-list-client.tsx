'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReceivableSummary, ReceivableSaleItem } from '@/types/warung';
import { recordReceivablePaymentAction } from '@/app/actions/sales';
import { formatRupiah } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import {
  CreditCard,
  User,
  Phone,
  Receipt,
  ChevronRight,
  AlertCircle,
  Banknote,
  CheckCircle2,
} from 'lucide-react';

interface PiutangListClientProps {
  initialSummary: ReceivableSummary[];
}

export function PiutangListClient({ initialSummary }: PiutangListClientProps) {
  const router = useRouter();

  // Selected sale for repayment
  const [selectedSale, setSelectedSale] = useState<{
    customerName: string;
    sale: ReceivableSaleItem;
  } | null>(null);

  // Payment form state
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(
    initialSummary.length > 0 ? initialSummary[0].customerName : null
  );

  const totalAllDue = initialSummary.reduce((sum, item) => sum + item.totalDue, 0);
  const totalAllSales = initialSummary.reduce((sum, item) => sum + item.saleCount, 0);

  const handleOpenPayment = (customerName: string, sale: ReceivableSaleItem) => {
    setSelectedSale({ customerName, sale });
    setPaymentAmountStr(String(sale.amountDue));
    setPaymentNote('');
    setError(null);
  };

  const handleClosePayment = () => {
    setSelectedSale(null);
    setPaymentAmountStr('');
    setPaymentNote('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmitPayment = async () => {
    if (!selectedSale || isSubmitting) return;

    const amount = Number(paymentAmountStr);
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      setError('Nominal pembayaran harus berupa bilangan bulat lebih dari 0.');
      return;
    }

    if (amount > selectedSale.sale.amountDue) {
      setError(
        `Nominal pembayaran (${formatRupiah(amount)}) melebihi sisa piutang (${formatRupiah(
          selectedSale.sale.amountDue
        )}).`
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await recordReceivablePaymentAction({
        saleId: selectedSale.sale.id,
        amount,
        note: paymentNote.trim() || undefined,
      });

      if (res.success) {
        handleClosePayment();
        router.refresh();
      } else {
        setError(res.error?.message || 'Gagal mencatat pembayaran piutang.');
        setIsSubmitting(false);
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary KPI Card */}
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-body font-semibold text-text">Total Piutang Belum Lunas</span>
          </div>
          <Badge variant="warning">{initialSummary.length} Pelanggan</Badge>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-h1 font-bold text-amber-600 dark:text-amber-400">
            {formatRupiah(totalAllDue)}
          </span>
          <span className="text-caption text-text-muted">
            {totalAllSales} transaksi belum lunas
          </span>
        </div>
      </div>

      {/* Customer Receivables List */}
      <div className="flex flex-col gap-2">
        <h3 className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
          Daftar Tagihan Pelanggan
        </h3>

        {initialSummary.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-body-medium font-semibold text-text">Tidak Ada Piutang</h4>
            <p className="text-caption text-text-secondary max-w-xs">
              Semua transaksi penjualan telah lunas. Tidak ada tagihan pelanggan yang tertunda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {initialSummary.map((customer) => {
              const isExpanded = expandedCustomer === customer.customerName;

              return (
                <div
                  key={customer.customerName}
                  className="rounded-2xl bg-surface border border-border overflow-hidden transition-all"
                >
                  {/* Customer Accordion Header */}
                  <div
                    onClick={() =>
                      setExpandedCustomer(isExpanded ? null : customer.customerName)
                    }
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-surface-subtle text-primary border border-border/60 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-body-medium font-bold text-text truncate">
                            {customer.customerName}
                          </h4>
                          <Badge variant="muted">{customer.saleCount} nota</Badge>
                        </div>
                        {customer.customerPhone && (
                          <div className="flex items-center gap-1 text-caption text-text-muted mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{customer.customerPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-body-medium font-bold text-amber-600 dark:text-amber-400 block">
                          {formatRupiah(customer.totalDue)}
                        </span>
                        <span className="text-xs text-text-muted">Total Owed</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-primary' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Outstanding Sales */}
                  {isExpanded && (
                    <div className="border-t border-border/60 bg-surface-subtle/50 divide-y divide-border/40">
                      {customer.sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-3.5 h-3.5 text-text-muted" />
                              <span className="font-mono text-small font-semibold text-text">
                                {sale.transactionNumber}
                              </span>
                              <Badge
                                variant={sale.paymentStatus === 'partial' ? 'warning' : 'danger'}
                              >
                                {sale.paymentStatus === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                              </Badge>
                            </div>
                            <div className="text-caption text-text-secondary mt-0.5">
                              Tgl: {sale.transactionDate} • Total: {formatRupiah(sale.totalAmount)}
                            </div>
                            <div className="text-caption text-text-muted">
                              Sudah dibayar: {formatRupiah(sale.amountPaid)}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-body-medium font-bold text-amber-600 dark:text-amber-400">
                              {formatRupiah(sale.amountDue)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(customer.customerName, sale)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-2xs"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Settlement Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedSale)}
        onClose={handleClosePayment}
        title="Pembayaran Piutang"
      >
        {selectedSale && (
          <div className="flex flex-col gap-4 py-2">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Sale Summary */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-medium text-text-secondary">Pelanggan</span>
                <span className="text-small font-bold text-text">
                  {selectedSale.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption font-medium text-text-secondary">No. Transaksi</span>
                <span className="font-mono text-small font-semibold text-text">
                  {selectedSale.sale.transactionNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption font-medium text-text-secondary">Total Tagihan</span>
                <span className="text-small font-semibold text-text">
                  {formatRupiah(selectedSale.sale.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-caption font-semibold text-amber-600 dark:text-amber-400">
                  Sisa Piutang Owed
                </span>
                <span className="text-body-medium font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(selectedSale.sale.amountDue)}
                </span>
              </div>
            </div>

            {/* Payment Input */}
            <div className="flex flex-col gap-2">
              <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
                Nominal Pembayaran
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-text-secondary font-medium">Rp</div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={selectedSale.sale.amountDue}
                  value={paymentAmountStr}
                  onChange={(e) => {
                    setPaymentAmountStr(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-xl text-body-medium font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  placeholder="0"
                />
              </div>

              {/* Quick shortcut: Pelunasan Penuh */}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmountStr(String(selectedSale.sale.amountDue))}
                  className="flex-1 py-2 rounded-lg bg-surface-subtle border border-border text-caption font-semibold text-primary hover:bg-border transition-colors"
                >
                  Lunasi Penuh ({formatRupiah(selectedSale.sale.amountDue)})
                </button>
              </div>
            </div>

            {/* Optional Note Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
                Catatan Pembayaran <span className="text-text-muted text-xs font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Contoh: Titip lewat saudara, transfer BCA, dll."
                className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>

            {/* Sisa Piutang Setelah Pembayaran */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border mt-1">
              <span className="text-caption font-medium text-text-secondary">
                Sisa Setelah Pembayaran Ini
              </span>
              <span className="text-body-medium font-bold text-text">
                {formatRupiah(
                  Math.max(0, selectedSale.sale.amountDue - (Number(paymentAmountStr) || 0))
                )}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitPayment}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full h-12 mt-2 rounded-xl bg-primary text-white font-semibold text-body-medium hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                'Memproses Pelunasan...'
              ) : (
                <>
                  <Banknote className="w-5 h-5" />
                  Konfirmasi Bayar Piutang
                </>
              )}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import { AlertCircle, Banknote } from 'lucide-react';

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (
    paymentAmount: number,
    customerName?: string,
    customerPhone?: string
  ) => Promise<void>;
}

export function PaymentSheet({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
}: PaymentSheetProps) {
  const [paymentAmountStr, setPaymentAmountStr] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentAmount = paymentAmountStr === '' ? totalAmount : Number(paymentAmountStr) || 0;
  const changeAmount = paymentAmount - totalAmount;
  const isUnderpaid = paymentAmount < totalAmount;
  const isUnpaid = paymentAmount === 0;

  const handleQuickAmount = (amount: number) => {
    setPaymentAmountStr(String(amount));
  };

  const handleClose = () => {
    setPaymentAmountStr('');
    setCustomerName('');
    setCustomerPhone('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (isUnderpaid && !customerName.trim()) {
      setError('Nama pelanggan wajib diisi untuk transaksi belum lunas / piutang.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm(
        paymentAmount,
        customerName.trim() || undefined,
        customerPhone.trim() || undefined
      );
      // Let parent handle closing on success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan transaksi.');
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Pembayaran">
      <div className="flex flex-col gap-4 py-2">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Total Belanja */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-1">
          <span className="text-body text-text-secondary">Total Tagihan</span>
          <span className="text-h1 font-bold text-text">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Uang Diterima Input */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
            Uang Diterima
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-text-secondary font-medium">Rp</div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={paymentAmountStr}
              onChange={(e) => {
                setPaymentAmountStr(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-xl text-body-medium font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              placeholder="0"
            />
          </div>
          
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleQuickAmount(totalAmount)}
              className="py-2 rounded-lg bg-surface-subtle border border-border text-caption font-medium text-text hover:bg-border transition-colors"
            >
              Uang Pas
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(0)}
              className="py-2 rounded-lg bg-surface-subtle border border-border text-caption font-medium text-amber-600 dark:text-amber-400 hover:bg-border transition-colors"
            >
              Belum Bayar
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(50000)}
              className="py-2 rounded-lg bg-surface-subtle border border-border text-caption font-medium text-text hover:bg-border transition-colors"
            >
              50k
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(100000)}
              className="py-2 rounded-lg bg-surface-subtle border border-border text-caption font-medium text-text hover:bg-border transition-colors"
            >
              100k
            </button>
          </div>
        </div>

        {/* Customer snapshot inputs */}
        <div className={`flex flex-col gap-3 p-3.5 rounded-2xl border transition-colors ${
          isUnderpaid
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-surface-subtle border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text uppercase tracking-wider">
              Data Pelanggan
            </span>
            {isUnderpaid && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Wajib untuk Piutang
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-text-secondary">
              Nama Pelanggan {isUnderpaid && <span className="text-danger">*</span>}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Contoh: Pak Budi"
              className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-text-secondary">
              Nomor Telepon <span className="text-text-muted text-xs font-normal">(Opsional)</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
        </div>

        {/* Kembalian / Sisa Piutang */}
        {isUnderpaid ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex flex-col">
              <span className="text-caption font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Sisa Piutang (Belum Dibayar)
              </span>
              <span className="text-xs text-text-secondary">
                {isUnpaid ? 'Belum dibayar sama sekali' : 'Sebagian dibayar'}
              </span>
            </div>
            <span className="text-body-medium font-bold text-amber-600 dark:text-amber-400">
              {formatRupiah(totalAmount - paymentAmount)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-subtle border border-border">
            <span className="text-body font-medium text-text-secondary">Kembalian</span>
            <span className="text-body-medium font-bold text-success">
              {formatRupiah(Math.max(0, changeAmount))}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 w-full h-12 mt-2 rounded-xl bg-primary text-white font-semibold text-body-medium hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            'Memproses...'
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              {isUnderpaid ? 'Simpan Sebagai Piutang' : 'Konfirmasi Pembayaran'}
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
}

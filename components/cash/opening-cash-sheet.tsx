'use client';

import React, { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { setOpeningCashAction } from '@/app/actions/cash';
import { formatRupiah } from '@/lib/format';
import { AlertCircle, Banknote, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface OpeningCashSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentOpeningCash?: number;
  currentNote?: string;
  isInitialized?: boolean;
  targetDateStr?: string;
  onSuccess?: () => void;
}

const QUICK_CHIPS = [20000, 50000, 100000];

export function OpeningCashSheet({
  isOpen,
  onClose,
  currentOpeningCash = 0,
  currentNote = '',
  isInitialized = false,
  targetDateStr,
  onSuccess,
}: OpeningCashSheetProps) {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountStr(isInitialized ? String(currentOpeningCash) : '');
      setNote(currentNote || '');
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, isInitialized, currentOpeningCash, currentNote]);

  const numericAmount = amountStr === '' ? 0 : Number(amountStr) || 0;

  const handleQuickAdd = (chipAmount: number) => {
    setAmountStr((prev) => {
      const current = Number(prev) || 0;
      return String(current + chipAmount);
    });
    setError(null);
  };

  const handleQuickSet = (presetAmount: number) => {
    setAmountStr(String(presetAmount));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (amountStr.trim() === '') {
      setError('Nominal saldo awal wajib diisi (boleh 0 jika kasir kosong).');
      return;
    }

    if (numericAmount < 0 || !Number.isInteger(numericAmount)) {
      setError('Nominal saldo awal harus bilangan bulat lebih besar atau sama dengan 0.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await setOpeningCashAction({
        date: targetDateStr,
        openingCash: numericAmount,
        openingNote: note.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error?.message || 'Gagal menyimpan saldo awal.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isInitialized ? 'Ubah Saldo Awal Kas' : 'Buka Kasir / Saldo Awal'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-success-soft border border-success/30 text-success text-small font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Saldo awal berhasil disimpan!</span>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-soft text-primary-dark shrink-0">
            <Banknote className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-caption font-semibold text-text uppercase tracking-wider block">
              Uang Modal / Kembalian
            </span>
            <p className="text-caption text-text-secondary leading-snug">
              Fisik uang receh yang sudah ada di laci kasir sebelum transaksi dimulai.
            </p>
          </div>
        </div>

        {/* Input Nominal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
            Saldo Awal Kasir
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-text-secondary font-bold text-body-medium">
              Rp
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                if (error) setError(null);
              }}
              placeholder="0"
              className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-xl text-display font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              autoFocus
            />
          </div>
          <span className="text-caption text-text-muted px-1">
            Terbaca: <strong className="text-text font-semibold">{formatRupiah(numericAmount)}</strong>
          </span>
        </div>

        {/* Quick Amount Chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-caption text-text-secondary font-medium px-1">
            Tambah cepat ke nominal:
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSet(0)}
              className="py-2 px-1 rounded-xl bg-surface-subtle border border-border text-caption font-medium text-text hover:bg-border active:scale-95 transition-all text-center"
            >
              Rp0
            </button>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickAdd(chip)}
                className="py-2 px-1 rounded-xl bg-surface-subtle border border-border text-caption font-medium text-primary hover:bg-primary-soft active:scale-95 transition-all text-center"
              >
                +{chip / 1000}k
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
            Catatan Pecahan <span className="text-text-muted font-normal lowercase">(opsional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Pecahan 2k, 5k, 10k untuk kembalian"
            className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-surface-subtle border border-border text-body-medium font-semibold text-text-secondary hover:text-text active:scale-98 transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className="flex-1 h-12 rounded-xl bg-primary text-white text-body-medium font-semibold shadow-sm hover:bg-primary-dark active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isInitialized ? 'Simpan Perubahan' : 'Buka Kasir'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

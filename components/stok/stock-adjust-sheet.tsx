'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Product, StockAdjustmentType, StockAdjustmentReason } from '@/types/warung';
import { adjustStockAction } from '@/app/actions/products';
import { ProductIcon } from '@/components/ui/product-icon';
import { AlertCircle, Plus, Minus, ArrowRight } from 'lucide-react';

interface StockAdjustSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

interface ReasonOption {
  value: StockAdjustmentReason;
  label: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: 'pembelian', label: 'Pembelian' },
  { value: 'retur_supplier', label: 'Retur Supplier' },
  { value: 'rusak_kadaluarsa', label: 'Rusak / Kadaluarsa' },
  { value: 'pemakaian_sendiri', label: 'Pemakaian Sendiri' },
  { value: 'koreksi_opname', label: 'Koreksi Opname' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function StockAdjustSheet({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockAdjustSheetProps) {
  const [type, setType] = useState<StockAdjustmentType>('add');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<StockAdjustmentReason>('pembelian');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when opened or product changes
  useEffect(() => {
    if (isOpen) {
      setType('add');
      setAmount('');
      setReason('pembelian');
      setNote('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  const currentStock = product?.stock ?? 0;
  const unit = product?.unit ?? 'pcs';

  // Live calculation preview
  const parsedAmount = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) return null;
    return num;
  }, [amount]);

  const calculatedNewStock = useMemo(() => {
    if (parsedAmount === null) return null;
    if (type === 'add') {
      return currentStock + parsedAmount;
    }
    if (type === 'reduce') {
      return currentStock - parsedAmount;
    }
    return null;
  }, [currentStock, parsedAmount, type]);

  const isExcessReduction = type === 'reduce' && parsedAmount !== null && parsedAmount > currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || isSubmitting) return;

    const newErrors: Record<string, string> = {};

    // 1. Amount validation
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      newErrors.amount = 'Jumlah penyesuaian stok wajib diisi';
    } else {
      const num = Number(trimmedAmount);
      if (isNaN(num)) {
        newErrors.amount = 'Jumlah harus berupa angka yang valid';
      } else if (!Number.isInteger(num)) {
        newErrors.amount = 'Jumlah harus berupa bilangan bulat (tanpa desimal)';
      } else if (num <= 0) {
        newErrors.amount = 'Jumlah penyesuaian harus lebih besar dari 0';
      } else if (type === 'reduce' && num > currentStock) {
        newErrors.amount = `Jumlah pengurangan (${num} ${unit}) melebihi stok yang tersedia (${currentStock} ${unit})`;
      }
    }

    // 2. Reason validation
    if (!reason) {
      newErrors.reason = 'Alasan penyesuaian stok wajib dipilih';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalAmount = Number(trimmedAmount);
    const cleanNote = note.trim() || undefined;

    setIsSubmitting(true);
    try {
      const result = await adjustStockAction({
        productId: product.id,
        type,
        amount: finalAmount,
        reason,
        note: cleanNote,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ general: result.error.message });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyesuaikan stok';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Penyesuaian Stok"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        {/* General Error Banner */}
        {errors.general && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Product Information Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle border border-border/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface text-primary shrink-0 border border-border/60">
              <ProductIcon name={product.iconName} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-body-medium font-semibold text-text truncate">
                {product.name}
              </h4>
              <p className="text-caption text-text-secondary truncate">
                {product.family} • {product.category}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="text-caption text-text-muted">Stok Saat Ini</span>
            <span className="text-body-medium font-bold text-text">
              {currentStock} <span className="text-caption font-normal text-text-muted">{unit}</span>
            </span>
          </div>
        </div>

        {/* Adjustment Type Selector: + Tambah vs - Kurang */}
        <div>
          <label className="text-caption font-semibold text-text-secondary block mb-1.5 uppercase tracking-wider">
            Jenis Penyesuaian
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('add');
                if (reason === 'rusak_kadaluarsa' || reason === 'pemakaian_sendiri') {
                  setReason('pembelian');
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-small font-semibold transition-all ${
                type === 'add'
                  ? 'bg-success text-white border-success shadow-xs'
                  : 'bg-surface border-border text-text-secondary hover:text-text'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Stok</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('reduce');
                if (reason === 'pembelian') {
                  setReason('rusak_kadaluarsa');
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-small font-semibold transition-all ${
                type === 'reduce'
                  ? 'bg-danger text-white border-danger shadow-xs'
                  : 'bg-surface border-border text-text-secondary hover:text-text'
              }`}
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
              <span>Kurang Stok</span>
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="text-caption font-semibold text-text-secondary block mb-1">
            Jumlah ({unit}) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.amount;
                  return next;
                });
              }
            }}
            placeholder="Masukkan jumlah..."

            className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-body font-medium text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.amount && (
            <p className="text-[11px] text-danger mt-1 font-medium">{errors.amount}</p>
          )}
          {isExcessReduction && (
            <p className="text-[11px] text-danger mt-1 font-medium">
              Pengurangan ({parsedAmount} {unit}) melebihi stok yang ada ({currentStock} {unit})!
            </p>
          )}
        </div>

        {/* Reason Dropdown */}
        <div>
          <label className="text-caption font-semibold text-text-secondary block mb-1">
            Alasan Penyesuaian <span className="text-danger">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
            className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.reason && (
            <p className="text-[11px] text-danger mt-1">{errors.reason}</p>
          )}
        </div>

        {/* Optional Note */}
        <div>
          <label className="text-caption font-semibold text-text-secondary block mb-1">
            Catatan (Opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Restock mingguan, kemasan rusak..."
            className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Live Calculation Preview Card */}
        <div className="p-3 rounded-2xl bg-surface-subtle border border-border/70 flex flex-col gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Ringkasan Perubahan
          </span>

          <div className="flex items-center justify-between text-small pt-1">
            <div className="flex flex-col">
              <span className="text-caption text-text-secondary">Stok Sekarang</span>
              <span className="font-semibold text-text">
                {currentStock} {unit}
              </span>
            </div>

            <div className="flex items-center gap-1 text-text-muted">
              {type === 'add' ? (
                <span className="text-success font-bold text-body">
                  +{parsedAmount !== null ? parsedAmount : '0'}
                </span>
              ) : (
                <span className="text-danger font-bold text-body">
                  -{parsedAmount !== null ? parsedAmount : '0'}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-text-muted mx-1" />
            </div>

            <div className="flex flex-col items-end">
              <span className="text-caption text-text-secondary">Stok Baru</span>
              <span
                className={`font-bold text-body ${
                  isExcessReduction
                    ? 'text-danger'
                    : calculatedNewStock !== null && calculatedNewStock <= (product.minStock ?? 0)
                    ? 'text-warning'
                    : 'text-text'
                }`}
              >
                {calculatedNewStock !== null ? `${calculatedNewStock} ${unit}` : `- ${unit}`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-subtle text-small font-medium transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isExcessReduction || !amount.trim()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-98 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

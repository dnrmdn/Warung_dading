'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { createExpenseAction } from '@/app/actions/expenses';
import { ExpenseCategory } from '@/types/warung';
import { formatRupiah } from '@/lib/format';
import {
  AlertCircle,
  Zap,
  FlameKindling,
  Truck,
  Users,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CATEGORIES: Array<{
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'operasional', label: 'Operasional', icon: Zap },
  { id: 'bahan_baku', label: 'Bahan Baku', icon: FlameKindling },
  { id: 'transportasi', label: 'Transportasi', icon: Truck },
  { id: 'gaji', label: 'Gaji / Upah', icon: Users },
  { id: 'peralatan', label: 'Peralatan', icon: Wrench },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal },
];

export function CatatPengeluaranClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [expenseDate, setExpenseDate] = useState(todayISO);
  const [category, setCategory] = useState<ExpenseCategory>('operasional');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');

  // UI / Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse amount for preview
  const parsedAmount = (() => {
    const clean = amountStr.trim();
    if (!clean) return 0;
    const n = Number(clean);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const newErrors: Record<string, string> = {};

    if (!expenseDate) {
      newErrors.expenseDate = 'Tanggal pengeluaran wajib diisi.';
    }

    if (!parsedAmount || parsedAmount <= 0) {
      newErrors.amount = 'Jumlah nominal harus lebih dari 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await createExpenseAction({
        expenseDate,
        category,
        amount: parsedAmount,
        description: description.trim() || undefined,
      });

      if (!result.success) {
        setErrors({ general: result.error.message });
        return;
      }

      router.push('/pengeluaran');
      router.refresh();
    });
  };

  return (
    <AppShell>
      <HeaderBar
        title="Catat Pengeluaran"
        backHref="/pengeluaran"
      />

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5 max-w-lg mx-auto">
        {/* General Error Banner */}
        {errors.general && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Tanggal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Tanggal Pengeluaran
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            disabled={isPending}
            className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-small font-medium text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          {errors.expenseDate && (
            <span className="text-caption text-danger">{errors.expenseDate}</span>
          )}
        </div>

        {/* Kategori */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Kategori
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  disabled={isPending}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-primary-soft border-primary text-primary font-semibold shadow-xs'
                      : 'bg-surface border-border text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                  <span className="text-caption leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nominal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Nominal Biaya (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-small font-bold text-text-muted">
              Rp
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              disabled={isPending}
              className="w-full h-11 pl-10 pr-3.5 bg-surface border border-border rounded-xl text-small font-bold text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>
          {parsedAmount > 0 && (
            <span className="text-caption text-text-muted">
              Terbaca: <strong className="text-text font-semibold">{formatRupiah(parsedAmount)}</strong>
            </span>
          )}
          {errors.amount && (
            <span className="text-caption text-danger">{errors.amount}</span>
          )}
        </div>

        {/* Keterangan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Keterangan / Rincian (Opsional)
          </label>
          <textarea
            rows={3}
            placeholder="Contoh: Token listrik 100rb, isi ulang galon 2x"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            className="w-full p-3 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-small shadow-sm hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

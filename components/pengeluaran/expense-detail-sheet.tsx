'use client';

import React from 'react';
import { Expense, ExpenseCategory } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import {
  CalendarDays,
  Tag,
  FileText,
  Zap,
  FlameKindling,
  Truck,
  Users,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

interface ExpenseDetailSheetProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operasional: 'Operasional',
  bahan_baku: 'Bahan Baku',
  transportasi: 'Transportasi',
  gaji: 'Gaji / Upah',
  peralatan: 'Peralatan',
  lainnya: 'Lainnya',
};

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  operasional: Zap,
  bahan_baku: FlameKindling,
  transportasi: Truck,
  gaji: Users,
  peralatan: Wrench,
  lainnya: MoreHorizontal,
};

function formatExpenseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ExpenseDetailSheet({
  expense,
  open,
  onOpenChange,
}: ExpenseDetailSheetProps) {
  if (!expense) return null;

  const CategoryIcon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
  const categoryLabel = CATEGORY_LABELS[expense.category] || expense.category;

  return (
    <BottomSheet
      isOpen={open && expense !== null}
      onClose={() => onOpenChange(false)}
      title="Detail Pengeluaran"
    >
      <div className="flex flex-col gap-4 pb-4">
        {/* Total Display Header */}
        <div className="p-4 rounded-xl bg-surface-subtle border border-border/60 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-caption text-text-secondary">Nominal Pengeluaran</span>
          <span className="text-display font-bold text-text">
            {formatRupiah(expense.amount)}
          </span>
        </div>

        {/* Transaction Details */}
        <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border/60">
          {/* Category */}
          <div className="flex items-start gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warning-soft text-warning shrink-0 mt-0.5">
              <CategoryIcon className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-caption text-text-secondary block">Kategori</span>
              <span className="text-small font-semibold text-text">{categoryLabel}</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface text-text-muted shrink-0 mt-0.5 border border-border/60">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-caption text-text-secondary block">Tanggal</span>
              <span className="text-small font-medium text-text">
                {formatExpenseDate(expense.expenseDate)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface text-text-muted shrink-0 mt-0.5 border border-border/60">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-caption text-text-secondary block">Keterangan</span>
              <span className="text-small text-text">
                {expense.description?.trim() || (
                  <span className="text-text-muted italic">Tidak ada catatan</span>
                )}
              </span>
            </div>
          </div>

          {/* ID */}
          <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface text-text-muted shrink-0 mt-0.5 border border-border/60">
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-caption text-text-secondary block">ID Referensi</span>
              <span className="text-caption font-mono text-text-muted break-all">
                {expense.id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

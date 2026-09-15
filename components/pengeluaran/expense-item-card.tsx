'use client';

import React from 'react';
import { Expense, ExpenseCategory } from '@/types/warung';
import { formatRupiah } from '@/lib/format';
import {
  ChevronRight,
  Zap,
  FlameKindling,
  Truck,
  Users,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

// ─── Typed mappings ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operasional: 'Operasional',
  bahan_baku: 'Bahan Baku',
  transportasi: 'Transportasi',
  gaji: 'Gaji / Upah',
  peralatan: 'Peralatan',
  lainnya: 'Lainnya',
};

type LucideIconComponent = React.ComponentType<{ className?: string }>;

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIconComponent> = {
  operasional: Zap,
  bahan_baku: FlameKindling,
  transportasi: Truck,
  gaji: Users,
  peralatan: Wrench,
  lainnya: MoreHorizontal,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpenseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExpenseItemCardProps {
  expense: Expense;
  onClick: (expense: Expense) => void;
}

export function ExpenseItemCard({ expense, onClick }: ExpenseItemCardProps) {
  const CategoryIcon = CATEGORY_ICONS[expense.category];
  const categoryLabel = CATEGORY_LABELS[expense.category];

  return (
    <button
      type="button"
      onClick={() => onClick(expense)}
      className="w-full text-left flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border/80 hover:border-primary/40 hover:shadow-2xs active:scale-[0.99] transition-all group"
      aria-label={`Lihat detail pengeluaran ${expense.id}`}
    >
      {/* Category Icon */}
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning-soft text-warning shrink-0">
        <CategoryIcon className="w-4 h-4 stroke-[1.8]" />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Date */}
        <span className="text-body-medium font-semibold text-text truncate block">
          {formatExpenseDate(expense.expenseDate)}
        </span>

        {/* Row 2: Category · description preview */}
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <span className="text-caption text-text-secondary shrink-0">
            {categoryLabel}
          </span>
          {expense.description && (
            <>
              <span className="text-caption text-text-muted shrink-0">·</span>
              <span className="text-caption text-text-muted truncate">
                {expense.description}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount + Chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-body-medium font-bold text-text group-hover:text-primary transition-colors">
          {formatRupiah(expense.amount)}
        </span>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

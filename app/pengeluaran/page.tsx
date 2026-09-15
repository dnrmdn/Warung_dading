import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { getExpenses } from '@/lib/services/expenses';
import { ExpenseListClient } from '@/components/pengeluaran/expense-list-client';
import { formatRupiah } from '@/lib/format';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { Plus, TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PengeluaranPage() {
  await enforceAdminPage();
  const expenses = await getExpenses();

  // Sort newest-first: expenseDate desc, then createdAt desc
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateDiff = b.expenseDate.localeCompare(a.expenseDate);
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Current-month summary derived from PostgreSQL-backed expenses
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const thisMonthExpenses = sortedExpenses.filter((e) => {
    const [year, month] = e.expenseDate.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthlyTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyCount = thisMonthExpenses.length;

  const currentMonthLabel = now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppShell>
      <HeaderBar
        title="Pengeluaran"
        subtitle={`${expenses.length} transaksi tercatat`}
        backHref="/more"
        rightAction={
          <Link
            href="/pengeluaran/baru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs"
            aria-label="Catat pengeluaran baru"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat</span>
          </Link>
        }
      />

      <div className="flex flex-col gap-4 p-4">
        {/* Monthly Summary Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <span className="text-caption text-text-muted">{currentMonthLabel}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-display font-bold text-text">
              {formatRupiah(monthlyTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warning-soft text-warning shrink-0">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <span className="text-caption text-text-secondary">
              {monthlyCount === 0
                ? 'Belum ada pengeluaran bulan ini'
                : `${monthlyCount} transaksi pengeluaran`}
            </span>
          </div>
        </div>

        {/* Interactive Expense List & Detail Modal */}
        <ExpenseListClient expenses={sortedExpenses} />
      </div>
    </AppShell>
  );
}

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { getPurchases } from '@/lib/services/purchases';
import { PurchaseListClient } from '@/components/pembelian/purchase-list-client';
import { formatRupiah } from '@/lib/format';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { Plus, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PembelianPage() {
  await enforceAdminPage();
  const purchases = await getPurchases();

  // Sort newest-first by purchaseDate then createdAt
  const sortedPurchases = [...purchases].sort((a, b) => {
    const dateDiff = b.purchaseDate.localeCompare(a.purchaseDate);
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Current-month summary derived from PostgreSQL-backed purchases
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const thisMonthPurchases = sortedPurchases.filter((p) => {
    const [year, month] = p.purchaseDate.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthlyTotal = thisMonthPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const monthlyCount = thisMonthPurchases.length;

  const currentMonthLabel = now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppShell>
      <HeaderBar
        title="Pembelian"
        subtitle={`${purchases.length} transaksi tercatat`}
        backHref="/more"
        rightAction={
          <Link
            href="/pembelian/baru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs"
            aria-label="Catat pembelian baru"
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
              Belanja Bulan Ini
            </span>
            <span className="text-caption text-text-muted">{currentMonthLabel}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-display font-bold text-text">
              {formatRupiah(monthlyTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-caption text-text-secondary">
              {monthlyCount === 0
                ? 'Belum ada transaksi bulan ini'
                : `${monthlyCount} transaksi belanja`}
            </span>
          </div>
        </div>

        {/* Purchase List or Empty State */}
        <PurchaseListClient purchases={sortedPurchases} />
      </div>
    </AppShell>
  );
}

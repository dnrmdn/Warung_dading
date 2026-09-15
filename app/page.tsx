import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { getDashboardStats } from '@/lib/services/dashboard';
import { formatRupiah } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { ProductIcon } from '@/components/ui/product-icon';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import {
  TrendingUp,
  Coins,
  Receipt,
  AlertTriangle,
  ChevronRight,
  ShoppingCart,
  Package,
  CreditCard,
} from 'lucide-react';

export default async function HomePage() {
  await enforceAdminPage();

  const {
    todayRevenue,
    todayProfit,
    todayTransactions,
    todayInitialAmountPaid,
    todayInitialAmountDue,
    totalReceivableDue,
    unpaidCustomerCount,
    topProducts,
    lowStockProducts,
    totalProductCount,
  } = await getDashboardStats();

  return (
    <AppShell>
      {/* Top Header */}
      <HeaderBar
        title="Warung Smart"
        subtitle="Ringkasan Operasional Hari Ini"
        rightAction={
          <Badge variant="success" className="px-2 py-0.5 text-caption">
            Buka
          </Badge>
        }
      />

      <div className="flex flex-col gap-4 p-4">
        {/* Today's Metrics Overview Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <span className="text-caption text-text-muted">Real-time</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-display font-bold text-text">
              {formatRupiah(todayRevenue)}
            </span>
            {/* Today's Sales Cash vs Receivable Breakdown */}
            <div className="flex items-center gap-2 text-caption text-text-secondary">
              <span>Kas POS: <strong className="text-success font-semibold">{formatRupiah(todayInitialAmountPaid)}</strong></span>
              <span>•</span>
              <span>Piutang Terbentuk: <strong className={todayInitialAmountDue > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-text-muted'}>{formatRupiah(todayInitialAmountDue)}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            {/* Laba Bersih */}
            <div className="p-2.5 rounded-xl bg-surface-subtle flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success-soft text-success shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-caption text-text-secondary block">
                  Est. Laba
                </span>
                <span className="text-body-medium font-bold text-success block truncate">
                  {formatRupiah(todayProfit)}
                </span>
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="p-2.5 rounded-xl bg-surface-subtle flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-soft text-primary-dark shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-caption text-text-secondary block">
                  Transaksi
                </span>
                <span className="text-body-medium font-bold text-text block truncate">
                  {todayTransactions} nota
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Outstanding Receivables Banner / Link */}
        {totalReceivableDue > 0 && (
          <Link
            href="/piutang"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                <CreditCard className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-caption font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Total Piutang Belum Lunas
                  </span>
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    {unpaidCustomerCount} pelanggan
                  </Badge>
                </div>
                <span className="text-body-medium font-bold text-amber-800 dark:text-amber-200 block mt-0.5">
                  {formatRupiah(totalReceivableDue)}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        )}

        {/* Quick Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/jual"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary text-white font-medium shadow-sm hover:bg-primary-dark active:scale-98 transition-all"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-body-medium font-bold block leading-tight">
                Mulai Jual
              </span>
              <span className="text-caption text-white/80 block mt-0.5">
                Kasir Cepat
              </span>
            </div>
          </Link>

          <Link
            href="/stok"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-border text-text font-medium shadow-2xs hover:border-primary/50 active:scale-98 transition-all"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-subtle text-primary">
              <Package className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-body-medium font-bold block leading-tight">
                Cek Stok
              </span>
              <span className="text-caption text-text-secondary block mt-0.5">
                {totalProductCount} item
              </span>
            </div>
          </Link>
        </div>

        {/* Low Stock Warning Section */}
        {lowStockProducts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-warning font-semibold text-small">
                <AlertTriangle className="w-4 h-4" />
                <span>Peringatan Stok Menipis</span>
              </div>
              <Link
                href="/stok"
                className="text-caption text-text-secondary hover:text-primary transition-colors"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="flex flex-col bg-surface rounded-2xl border border-border divide-y divide-border/60 overflow-hidden shadow-2xs">
              {lowStockProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/produk/${product.id}`}
                  className="flex items-center justify-between p-3 hover:bg-surface-subtle transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle text-primary shrink-0">
                      <ProductIcon name={product.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-body-medium font-medium text-text block truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <span className="text-caption text-text-secondary">
                        Sisa {product.stock} {product.unit} (Min. {product.minStock})
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Items Showcase */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-text font-semibold text-small">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Produk Terlaris</span>
            </div>
            <Link
              href="/jual"
              className="text-caption text-primary font-medium hover:underline"
            >
              Jual Sekarang
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-center shadow-2xs">
              <span className="text-caption text-text-muted">Belum ada data penjualan</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {topProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/produk/${product.id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle text-primary shrink-0">
                    <ProductIcon name={product.iconName} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-small font-medium text-text block truncate">
                      {product.name}
                    </span>
                    {product.price !== undefined && (
                      <span className="text-caption font-semibold text-primary block mt-0.5">
                        {formatRupiah(product.price)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

import React from 'react';
import { ReportSummary } from '@/lib/services/reports';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Calculator,
  Coins,
  TrendingDown,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Wallet,
} from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const isNetProfitPositive = summary.netProfit >= 0;
  const hasReceivables = summary.totalInitialAmountDue > 0 ||
    summary.paymentStatusBreakdown.partial.count > 0 ||
    summary.paymentStatusBreakdown.unpaid.count > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
      {/* 1. Total Omzet (Revenue) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-primary/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-primary/8 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Total Omzet
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary-dark shrink-0">
            <TrendingUp className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-text block tracking-tight leading-snug">
            {formatRupiah(summary.totalRevenue)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            {summary.totalTransactions} nota • {summary.totalItemsSold} item
          </span>
        </div>
      </div>

      {/* 2. Total HPP (Modal Pokok) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-warning/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-warning/8 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Modal Pokok (HPP)
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warning-soft text-warning shrink-0">
            <Calculator className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-text block tracking-tight leading-snug">
            {formatRupiah(summary.totalHpp)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            Modal barang terjual
          </span>
        </div>
      </div>

      {/* 3. Laba Kotor (Gross Profit) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-success/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-success/8 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Laba Kotor
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-success-soft text-success shrink-0">
            <Coins className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-success block tracking-tight leading-snug">
            {formatRupiah(summary.grossProfit)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            Margin: {summary.grossMarginPercent}%
          </span>
        </div>
      </div>

      {/* 4. Total Pengeluaran (Operasional) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-danger/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-danger/8 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Pengeluaran
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-danger-soft text-danger shrink-0">
            <TrendingDown className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-danger block tracking-tight leading-snug">
            {formatRupiah(summary.totalExpenses)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            Operasional & utilitas
          </span>
        </div>
      </div>

      {/* 5. Laba Bersih (Net Profit) */}
      <div
        className={cn(
          'p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden',
          isNetProfitPositive
            ? 'bg-success-soft/30 border-success/40'
            : 'bg-danger-soft/30 border-danger/40'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full pointer-events-none',
            isNetProfitPositive ? 'bg-success/15' : 'bg-danger/15'
          )}
        />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Laba Bersih
          </span>
          <div
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
              isNetProfitPositive
                ? 'bg-success text-white'
                : 'bg-danger text-white'
            )}
          >
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span
            className={cn(
              'text-[16px] sm:text-h2 md:text-h1 font-bold block tracking-tight leading-snug',
              isNetProfitPositive ? 'text-success' : 'text-danger'
            )}
          >
            {formatRupiah(summary.netProfit)}
          </span>
          <span className="text-caption text-text-secondary block mt-0.5 truncate">
            {isNetProfitPositive ? `Margin Bersih: ${summary.netMarginPercent}%` : 'Rugi Bersih'}
          </span>
        </div>
      </div>

      {/* 6. Belanja Stok (Pembelian Inflow) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-surface-subtle rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Belanja Stok
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-subtle text-primary shrink-0">
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-text block tracking-tight leading-snug">
            {formatRupiah(summary.totalPurchases)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            Arus kas pengadaan stok
          </span>
        </div>
      </div>

      {/* 7. Piutang Terbentuk (Receivables Created in Period) — conditional */}
      {hasReceivables && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-warning/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-warning/8 rounded-full pointer-events-none" />
          <div className="flex items-start justify-between gap-1.5">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
              Piutang Terbentuk
            </span>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warning-soft text-warning shrink-0">
              <CreditCard className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="min-w-0">
            <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-warning block tracking-tight leading-snug">
              {formatRupiah(summary.totalInitialAmountDue)}
            </span>
            <span className="text-caption text-text-muted block mt-0.5 truncate">
              {summary.paymentStatusBreakdown.partial.count + summary.paymentStatusBreakdown.unpaid.count} nota belum lunas
            </span>
          </div>
        </div>
      )}

      {/* 8. Kas Masuk Periode (Period Cash Inflow) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-primary/30 shadow-2xs flex flex-col justify-between gap-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-primary/8 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider leading-tight min-w-0 flex-1">
            Kas Masuk Periode
          </span>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary-dark shrink-0">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <span className="text-[16px] sm:text-h2 md:text-h1 font-bold text-primary-dark block tracking-tight leading-snug">
            {formatRupiah(summary.periodCashInflow)}
          </span>
          <span className="text-caption text-text-muted block mt-0.5 truncate">
            {summary.totalSettlementCollected > 0
              ? `Kas POS ${formatRupiah(summary.totalInitialAmountPaid)} + Pelunasan ${formatRupiah(summary.totalSettlementCollected)}`
              : `Kas penjualan periode`
            }
          </span>
        </div>
      </div>
    </div>
  );
}

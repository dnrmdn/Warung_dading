import React from 'react';
import { ReportSummary } from '@/lib/services/reports';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  Sparkles,
  PieChart,
  Wallet,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface ReportFinancialFlowProps {
  summary: ReportSummary;
}

export function ReportFinancialFlow({ summary }: ReportFinancialFlowProps) {
  const { totalRevenue, totalHpp, grossProfit, totalExpenses, netProfit } = summary;

  const hppPercent = totalRevenue > 0 ? Math.min(100, Math.round((totalHpp / totalRevenue) * 100)) : 0;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const expensePercent = totalRevenue > 0 ? Math.min(100, Math.round((totalExpenses / totalRevenue) * 100)) : 0;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const hasReceivables = summary.totalInitialAmountDue > 0 ||
    summary.paymentStatusBreakdown.partial.count > 0 ||
    summary.paymentStatusBreakdown.unpaid.count > 0;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-h3 font-bold text-text">Alur & Komposisi Keuangan</span>
          </div>
          <p className="text-caption text-text-secondary mt-0.5">
            Dekomposisi omzet penjualan menjadi laba bersih
          </p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-subtle text-primary">
          <PieChart className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {/* Waterfall Flow Step-Down Visualization */}
      <div className="flex flex-col gap-2.5">
        {/* Step 1: Omzet */}
        <div className="p-3 rounded-xl bg-primary-soft/30 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-caption font-bold">
              1
            </div>
            <div>
              <span className="text-small font-bold text-text block">Total Omzet (Pendapatan)</span>
              <span className="text-caption text-text-secondary">Basis pendapatan 100%</span>
            </div>
          </div>
          <span className="text-body-medium font-bold text-primary-dark">
            {formatRupiah(totalRevenue)}
          </span>
        </div>

        {/* Arrow Deduction */}
        <div className="flex items-center justify-center -my-1 text-text-muted">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 2: HPP Deduction */}
        <div className="p-3 rounded-xl bg-warning-soft/30 border border-warning/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-warning text-white text-caption font-bold">
              -
            </div>
            <div>
              <span className="text-small font-bold text-text block">Dikurangi Modal Pokok (HPP)</span>
              <span className="text-caption text-warning font-medium">{hppPercent}% dari omzet</span>
            </div>
          </div>
          <span className="text-body-medium font-bold text-warning">
            ({formatRupiah(totalHpp)})
          </span>
        </div>

        {/* Arrow Result */}
        <div className="flex items-center justify-center -my-1 text-text-muted">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 3: Gross Profit Result */}
        <div className="p-3 rounded-xl bg-success-soft/30 border border-success/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-success text-white text-caption font-bold">
              =
            </div>
            <div>
              <span className="text-small font-bold text-text block">Laba Kotor (Gross Profit)</span>
              <span className="text-caption text-success font-medium">Margin kotor: {grossMarginPercent}%</span>
            </div>
          </div>
          <span className="text-body-medium font-bold text-success">
            {formatRupiah(grossProfit)}
          </span>
        </div>

        {/* Arrow Deduction */}
        <div className="flex items-center justify-center -my-1 text-text-muted">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 4: Expense Deduction */}
        <div className="p-3 rounded-xl bg-danger-soft/30 border border-danger/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-danger text-white text-caption font-bold">
              -
            </div>
            <div>
              <span className="text-small font-bold text-text block">Dikurangi Beban Operasional</span>
              <span className="text-caption text-danger font-medium">{expensePercent}% dari omzet</span>
            </div>
          </div>
          <span className="text-body-medium font-bold text-danger">
            ({formatRupiah(totalExpenses)})
          </span>
        </div>

        {/* Arrow Result */}
        <div className="flex items-center justify-center -my-1 text-text-muted">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 5: Net Profit Final Result */}
        <div
          className={cn(
            'p-3.5 rounded-xl border flex items-center justify-between',
            netProfit >= 0
              ? 'bg-success-soft/50 border-success/40'
              : 'bg-danger-soft/50 border-danger/40'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-xl text-white font-bold',
                netProfit >= 0 ? 'bg-success' : 'bg-danger'
              )}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-body-medium font-bold text-text block">Laba Bersih Akhir</span>
              <span className="text-caption text-text-secondary">
                {netProfit >= 0 ? `Margin Bersih: ${netMarginPercent}%` : 'Defisit / Rugi'}
              </span>
            </div>
          </div>
          <span
            className={cn(
              'text-h3 font-bold',
              netProfit >= 0 ? 'text-success' : 'text-danger'
            )}
          >
            {formatRupiah(netProfit)}
          </span>
        </div>
      </div>

      {/* Cash Collection Breakdown — conditional on receivables */}
      {hasReceivables && (
        <>
          <div className="border-t border-border" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary stroke-[2]" />
              <span className="text-small font-bold text-text">Komposisi Penerimaan Kas</span>
            </div>
            <div className="flex flex-col gap-2">
              {/* Cash at POS */}
              <div className="p-2.5 rounded-lg bg-primary-soft/20 border border-primary/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary stroke-[2]" />
                  <span className="text-small text-text">Kas Diterima di POS</span>
                </div>
                <span className="text-small font-bold text-primary-dark">
                  {formatRupiah(summary.totalInitialAmountPaid)}
                </span>
              </div>

              {/* Piutang Created */}
              <div className="p-2.5 rounded-lg bg-warning-soft/20 border border-warning/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-warning stroke-[2]" />
                  <span className="text-small text-text">Piutang Terbentuk</span>
                </div>
                <span className="text-small font-bold text-warning">
                  {formatRupiah(summary.totalInitialAmountDue)}
                </span>
              </div>

              {/* Settlement Collections — only if > 0 */}
              {summary.totalSettlementCollected > 0 && (
                <div className="p-2.5 rounded-lg bg-success-soft/20 border border-success/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-success stroke-[2]" />
                    <span className="text-small text-text">Pelunasan Piutang Diterima</span>
                  </div>
                  <span className="text-small font-bold text-success">
                    +{formatRupiah(summary.totalSettlementCollected)}
                  </span>
                </div>
              )}

              {/* Total Period Cash Inflow */}
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border flex items-center justify-between mt-0.5">
                <span className="text-small font-bold text-text">Total Kas Masuk Periode</span>
                <span className="text-body-medium font-bold text-primary-dark">
                  {formatRupiah(summary.periodCashInflow)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

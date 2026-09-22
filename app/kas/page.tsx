import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getTodayCashPosition, getDailyCashBalance } from '@/lib/services/cash';
import { CashPositionCard } from '@/components/dashboard/cash-position-card';
import { formatRupiah } from '@/lib/format';
import { Wallet, Banknote, ArrowDownLeft, ArrowUpRight, Calendar, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function KasPage() {
  const [, cashPosition, dailyCash] = await Promise.all([
    enforceAdminPage(),
    getTodayCashPosition(),
    getDailyCashBalance(),
  ]);

  return (
    <AppShell>
      <HeaderBar
        title="Kas & Saldo Harian"
        subtitle="Posisi fisik uang di laci kasir"
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 pb-24">
        {/* Main Live Cash Position Card */}
        <CashPositionCard cashPosition={cashPosition} />

        {/* Detailed Breakdown Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary stroke-[2]" />
            <span className="text-caption font-bold text-text uppercase tracking-wider">
              Rincian Aliran Kas Hari Ini
            </span>
          </div>

          <div className="flex flex-col divide-y divide-border/60">
            {/* 1. Saldo Awal */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-subtle text-text-secondary">
                  <Banknote className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="text-small font-medium text-text block">Saldo Awal Kasir</span>
                  <span className="text-caption text-text-muted">
                    {dailyCash?.openingNote ? `Catatan: ${dailyCash.openingNote}` : 'Modal awal kembalian'}
                  </span>
                </div>
              </div>
              <span className="text-body-medium font-bold text-text">
                {formatRupiah(cashPosition.openingCash)}
              </span>
            </div>

            {/* 2. Kas Masuk POS */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-success-soft text-success">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-small font-medium text-text block">Kas Diterima di Kasir (POS)</span>
                  <span className="text-caption text-text-muted">Pembayaran tunai transaksi penjualan</span>
                </div>
              </div>
              <span className="text-body-medium font-bold text-success">
                +{formatRupiah(cashPosition.posCashIn)}
              </span>
            </div>

            {/* 3. Pelunasan Piutang */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-success-soft text-success">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-small font-medium text-text block">Pelunasan Piutang Diterima</span>
                  <span className="text-caption text-text-muted">Kas dari penagihan piutang hari ini</span>
                </div>
              </div>
              <span className="text-body-medium font-bold text-success">
                +{formatRupiah(cashPosition.receivableCashIn)}
              </span>
            </div>

            {/* 4. Pengeluaran */}
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-danger-soft text-danger">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-small font-medium text-text block">Pengeluaran Operasional</span>
                  <span className="text-caption text-text-muted">Biaya warung dibayar dari kasir</span>
                </div>
              </div>
              <span className="text-body-medium font-bold text-danger">
                -{formatRupiah(cashPosition.expenseCashOut)}
              </span>
            </div>
          </div>

          {/* Expected Total in Drawer */}
          <div className="pt-2 border-t border-border flex items-center justify-between bg-surface-subtle p-3 rounded-xl">
            <span className="text-body-medium font-bold text-text">Total Fisik di Laci</span>
            <span className="text-h2 font-bold text-primary-dark">
              {formatRupiah(cashPosition.expectedCash)}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

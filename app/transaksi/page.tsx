import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getSales, getTodayLocalDate } from '@/lib/services/sales';
import { TransaksiClient } from '@/components/transaksi/transaksi-client';

export const dynamic = 'force-dynamic';

export default async function TransaksiPage() {
  const today = getTodayLocalDate();
  const [, sales] = await Promise.all([
    enforceAdminPage(),
    getSales({
      startDate: today,
      endDate: today,
    }),
  ]);

  return (
    <AppShell>
      <HeaderBar
        title="Transaksi"
        subtitle="Riwayat transaksi penjualan"
        backHref="/"
      />
      <TransaksiClient initialSales={sales} todayDate={today} />
    </AppShell>
  );
}

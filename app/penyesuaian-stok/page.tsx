import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getStockAdjustmentHistory } from '@/lib/services/products';
import { StockAdjustmentHistory } from '@/components/stok/stock-adjustment-history';

export const dynamic = 'force-dynamic';

export default async function PenyesuaianStokPage() {
  const [, history] = await Promise.all([
    enforceAdminPage(),
    getStockAdjustmentHistory({ limit: 50 }),
  ]);

  return (
    <AppShell>
      <HeaderBar
        title="Riwayat Penyesuaian Stok"
        subtitle="Log koreksi opname & penyesuaian manual"
        backHref="/more"
      />
      <StockAdjustmentHistory initialHistory={history} />
    </AppShell>
  );
}

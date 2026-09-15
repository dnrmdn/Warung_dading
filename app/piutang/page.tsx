import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getReceivableSummary } from '@/lib/services/sales';
import { PiutangListClient } from '@/components/piutang/piutang-list-client';

export const dynamic = 'force-dynamic';

export default async function PiutangPage() {
  await enforceAdminPage();
  const summary = await getReceivableSummary();

  return (
    <AppShell>
      <HeaderBar
        title="Piutang Pelanggan"
        subtitle={`${summary.length} pelanggan belum lunas`}
        backHref="/more"
      />
      <div className="flex flex-col gap-4 p-4">
        <PiutangListClient initialSummary={summary} />
      </div>
    </AppShell>
  );
}

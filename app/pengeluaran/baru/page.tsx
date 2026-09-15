import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { CatatPengeluaranClient } from '@/components/pengeluaran/catat-pengeluaran-client';

export default async function CatatPengeluaranPage() {
  await enforceAdminPage();

  return <CatatPengeluaranClient />;
}

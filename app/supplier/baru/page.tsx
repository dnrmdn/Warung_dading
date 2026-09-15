import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { TambahSupplierClient } from '@/components/supplier/tambah-supplier-client';

export default async function TambahSupplierPage() {
  await enforceAdminPage();

  return <TambahSupplierClient />;
}

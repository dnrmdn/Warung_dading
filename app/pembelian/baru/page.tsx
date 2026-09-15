import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts } from '@/lib/services/products';
import { CatatPembelianClient } from '@/components/pembelian/catat-pembelian-client';

export default async function CatatPembelianPage() {
  await enforceAdminPage();
  const products = await getProducts({ includeInactive: false });

  return <CatatPembelianClient initialProducts={products} />;
}

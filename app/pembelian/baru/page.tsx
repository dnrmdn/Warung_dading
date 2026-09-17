import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategories } from '@/lib/services/products';
import { CatatPembelianClient } from '@/components/pembelian/catat-pembelian-client';

export default async function CatatPembelianPage() {
  await enforceAdminPage();
  const [products, categories] = await Promise.all([
    getProducts({ includeInactive: false }),
    getCategories(),
  ]);

  return <CatatPembelianClient initialProducts={products} categories={categories} />;
}

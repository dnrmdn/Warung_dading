import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategories } from '@/lib/services/products';
import { PosContainer } from '@/components/jual/pos-container';

export default async function JualPage() {
  await enforceAdminPage();
  const [products, rawCategories] = await Promise.all([
    getProducts({ includeInactive: false }),
    getCategories(),
  ]);

  const categories = ['Semua', ...rawCategories];

  return (
    <PosContainer
      initialProducts={products}
      categories={categories}
    />
  );
}

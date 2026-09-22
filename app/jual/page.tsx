import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategories } from '@/lib/services/products';
import { PosContainer } from '@/components/jual/pos-container';

export default async function JualPage() {
  const [, products, rawCategories] = await Promise.all([
    enforceAdminPage(),
    getProducts({ includeInactive: false, includeRecipe: false }),
    getCategories(),
  ]);

  const categories = ['Semua', ...rawCategories];

  const availableProducts = products.filter((product) => product.stock > 0);

  return (
    <PosContainer
      initialProducts={availableProducts}
      categories={categories}
    />
  );
}

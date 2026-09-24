import React from 'react';
import type { Metadata } from 'next';
import { PublicHeader } from '@/components/stok-publik/public-header';
import { PublicStockView } from '@/components/stok-publik/public-stock-view';
import { getPublicProducts } from '@/lib/services/public-products';

export const metadata: Metadata = {
  title: 'Stok Barang - Warung Dading',
  description: 'Cek ketersediaan stok barang di Warung Dading secara langsung dan real-time.',
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function PublicStockRootPage() {
  const products = await getPublicProducts();

  // Extract unique category names safely from the public products projection
  const categorySet = new Set<string>();
  for (const product of products) {
    if (product.category) {
      categorySet.add(product.category);
    }
  }
  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col min-h-dvh w-full min-w-0 max-w-lg mx-auto overflow-x-hidden bg-background text-text border-x border-border/40 relative">
      <PublicHeader
        title="Warung Dading"
        subtitle="Ketersediaan Stok Barang"
      />
      <PublicStockView products={products} categories={categories} />
    </div>
  );
}

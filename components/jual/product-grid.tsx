'use client';

import React from 'react';
import { Product } from '@/types/warung';
import { ProductTile } from './product-tile';

interface ProductGridProps {
  products: Product[];
  getItemQuantity: (productId: string) => number;
  onSelectProduct: (product: Product) => void;
}

export function ProductGrid({
  products,
  getItemQuantity,
  onSelectProduct,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-body text-text-secondary">Tidak ada produk yang cocok.</p>
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-6 gap-1.5 sm:gap-2 p-2 box-border overflow-hidden">
      {products.map((product) => (
        <ProductTile
          key={product.id}
          product={product}
          quantityInCart={getItemQuantity(product.id)}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
}

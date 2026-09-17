'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ProductIcon } from '@/components/ui/product-icon';
import { Search, CheckCircle2, Plus } from 'lucide-react';

interface PurchaseProductPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProductIds: string[];
  onSelect: (product: Product) => void;
  onCreateNew: () => void;
}

export function PurchaseProductPickerSheet({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  onSelect,
  onCreateNew,
}: PurchaseProductPickerSheetProps) {
  const [search, setSearch] = useState('');

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q) ||
        (p.variant?.toLowerCase().includes(q) ?? false)
    );
  }, [activeProducts, search]);

  function handleClose() {
    setSearch('');
    onClose();
  }

  function handleSelect(product: Product) {
    setSearch('');
    onSelect(product);
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Pilih Produk">
      <div className="flex flex-col gap-3 pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            className="w-full h-9 pl-9 pr-3 bg-surface-subtle border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Product list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <p className="text-body-medium font-medium text-text-secondary">
              {activeProducts.length === 0
                ? 'Belum ada produk aktif'
                : 'Produk tidak ditemukan'}
            </p>
            <p className="text-caption text-text-muted">
              {activeProducts.length === 0
                ? 'Tambahkan produk aktif di halaman Stok, atau buat bahan baru di sini.'
                : 'Coba kata kunci lain atau buat bahan baru.'}
            </p>
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Buat Bahan Baru
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((product) => {
              const isAlreadyAdded = selectedProductIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => !isAlreadyAdded && handleSelect(product)}
                  className={[
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
                    isAlreadyAdded
                      ? 'bg-surface-subtle border-border/50 opacity-60 cursor-not-allowed'
                      : 'bg-surface border-border/80 hover:border-primary/50 hover:bg-primary-soft/10 active:scale-[0.99] cursor-pointer',
                  ].join(' ')}
                  aria-label={`Pilih ${product.name}${isAlreadyAdded ? ' (sudah ditambahkan)' : ''}`}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle border border-border/60 text-primary shrink-0">
                    <ProductIcon name={product.iconName} className="w-4 h-4" />
                  </div>

                  {/* Name + variant + stock */}
                  <div className="min-w-0 flex-1">
                    <span className="text-small font-medium text-text block truncate">
                      {product.name}
                    </span>
                    <span className="text-caption text-text-muted block">
                      Stok: {product.stock} {product.unit}
                    </span>
                  </div>

                  {/* Already-added indicator */}
                  {isAlreadyAdded && (
                    <div className="flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-caption text-success font-medium">
                        Ditambahkan
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Persistent "Buat Bahan Baru" footer action */}
            <button
              type="button"
              onClick={onCreateNew}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-1 rounded-xl border border-dashed border-primary/50 bg-primary-soft/10 text-primary text-small font-semibold hover:bg-primary-soft/20 active:scale-[0.99] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Buat Bahan Baru
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

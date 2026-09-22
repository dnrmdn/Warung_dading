'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { SearchBar } from '@/components/ui/search-bar';
import { CategoryChips } from '@/components/jual/category-chips';
import { StockItemRow } from '@/components/stok/stock-item-row';
import { ProductFormSheet } from '@/components/stok/product-form-sheet';
import { StockAdjustSheet } from '@/components/stok/stock-adjust-sheet';
import { DeleteConfirmSheet } from '@/components/stok/delete-confirm-sheet';
import { deleteProductAction } from '@/app/actions/products';
import { Product, CategoryItem } from '@/types/warung';
import { AlertTriangle, Package, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type StockStatusFilter = 'all' | 'low';

interface StokClientProps {
  initialProducts: Product[];
  categories: CategoryItem[];
  initialStockStatus: StockStatusFilter;
}

export function StokClient({ initialProducts, categories, initialStockStatus }: StokClientProps) {
  const router = useRouter();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>(initialStockStatus);

  // Form sheet state (Create / Edit master data)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock Adjustment sheet state
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [selectedProductForStockId, setSelectedProductForStockId] = useState<string | null>(null);

  // Delete confirmation sheet state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setFormMode('edit');
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleOpenAdjustStock = (product: Product) => {
    setSelectedProductForStockId(product.id);
    setIsStockAdjustOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleCloseDelete = () => {
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteProductAction(productToDelete.id);
      if (result.success) {
        setProductToDelete(null);
        router.refresh();
      } else {
        console.error('[StokClient] deleteProductAction failed:', result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Derive product reference for stock adjust sheet from server-provided list
  const selectedProductForStock = useMemo(() => {
    if (!selectedProductForStockId) return null;
    return initialProducts.find((p) => p.id === selectedProductForStockId) || null;
  }, [initialProducts, selectedProductForStockId]);

  // Compute low stock count from server-provided list
  const lowStockCount = useMemo(
    () => initialProducts.filter((p) => p.stock <= p.minStock).length,
    [initialProducts]
  );

  // Category list with synthetic 'Semua' option
  const categoryOptions = useMemo(() => [
    { id: 'Semua', name: 'Semua' },
    ...categories,
  ], [categories]);

  // Category names for display in CategoryChips
  const chipNames = useMemo(() => categoryOptions.map((c) => c.name), [categoryOptions]);

  // Map categoryId <-> categoryName
  const selectedCategoryName = useMemo(() => {
    const matched = categoryOptions.find((c) => c.id === selectedCategoryId);
    return matched ? matched.name : 'Semua';
  }, [categoryOptions, selectedCategoryId]);

  const handleSelectCategoryName = (categoryName: string) => {
    const matched = categoryOptions.find((c) => c.name === categoryName);
    setSelectedCategoryId(matched ? matched.id : 'Semua');
  };

  // Category names array for ProductFormSheet (string[])
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  // Filter products by categoryId, stock status, and search query (AND)
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchCategory =
        selectedCategoryId === 'Semua' || product.categoryId === selectedCategoryId;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.family.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStockStatus =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'low' && product.stock <= product.minStock);
      return matchCategory && matchSearch && matchStockStatus;
    });
  }, [initialProducts, selectedCategoryId, searchQuery, stockStatusFilter]);

  return (
    <AppShell>
      <HeaderBar
        title="Stok"
        subtitle={`${filteredProducts.length} item terdaftar`}
        rightAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs"
            aria-label="Tambah Produk"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah</span>
          </button>
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {/* Search Input */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari item stok..."
        />

        {/* Category Filter Chips */}
        <CategoryChips
          categories={chipNames}
          selectedCategory={selectedCategoryName}
          onSelectCategory={handleSelectCategoryName}
          className="px-0 py-0 border-b-0 bg-transparent sticky-none static"
        />

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && selectedCategoryId === 'Semua' && !searchQuery && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warning-soft border border-warning/30 text-warning text-small">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{lowStockCount} produk</span> stok
              di bawah batas minimum.
            </div>
          </div>
        )}

        {/* Stock Item Rows List */}
        <div className="flex flex-col gap-2 pt-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Package className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
              <p className="text-body text-text-secondary">
                Tidak ada item stok yang cocok.
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <StockItemRow
                key={product.id}
                product={product}
                onEdit={handleOpenEdit}
                onAdjustStock={handleOpenAdjustStock}
                onDelete={handleOpenDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Product Create & Edit Bottom Sheet */}
      <ProductFormSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        mode={formMode}
        product={selectedProduct}
        categories={categoryNames}
        onSuccess={() => router.refresh()}
        onAdjustStock={handleOpenAdjustStock}
      />

      {/* Stock Adjustment Bottom Sheet (+ Tambah / - Kurang) */}
      <StockAdjustSheet
        isOpen={isStockAdjustOpen}
        onClose={() => {
          setIsStockAdjustOpen(false);
          setSelectedProductForStockId(null);
        }}
        product={selectedProductForStock}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Product Confirmation Bottom Sheet */}
      <DeleteConfirmSheet
        isOpen={productToDelete !== null}
        onClose={handleCloseDelete}
        product={productToDelete}
        onConfirm={handleConfirmDelete}
      />
    </AppShell>
  );
}

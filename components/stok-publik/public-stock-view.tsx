'use client';

import React, { useState, useMemo } from 'react';
import { SearchBar } from '@/components/ui/search-bar';
import { CategoryChips } from '@/components/jual/category-chips';
import { PublicStockItem } from '@/components/stok-publik/public-stock-item';
import { PublicCartSheet } from '@/components/stok-publik/public-cart-sheet';
import { getWhatsAppOrderUrl, type PublicCartItem } from '@/lib/whatsapp';
import { formatRupiah } from '@/lib/format';
import type { PublicProduct } from '@/lib/services/public-products';
import { PackageSearch, ShoppingBag, ArrowRight } from 'lucide-react';

interface PublicStockViewProps {
  products: PublicProduct[];
  categories: string[];
}

export function PublicStockView({ products, categories }: PublicStockViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Independent public cart state
  const [cartItems, setCartItems] = useState<PublicCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const categoryList = useMemo(() => {
    return ['Semua', ...categories];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'Semua' && p.category !== selectedCategory) {
        return false;
      }

      // Search filter (name and category only)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const getItemQuantity = (productId: string): number => {
    const item = cartItems.find((ci) => ci.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleSelectProduct = (product: PublicProduct) => {
    if (product.stock <= 0) return;
    if (product.price === null || product.price === undefined || product.price <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setFeedbackNotice(`Stok ${product.name} hanya tersedia ${product.stock} ${product.unit}`);
          setTimeout(() => setFeedbackNotice(null), 2500);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          unitPrice: product.price && product.price > 0 ? product.price : 0,
          quantity: 1,
          stock: product.stock,
          iconName: product.iconName,
        },
      ];
    });
  };

  const handleIncrement = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          if (item.quantity >= item.stock) {
            setFeedbackNotice(`Stok ${item.name} hanya tersedia ${item.stock} ${item.unit}`);
            setTimeout(() => setFeedbackNotice(null), 2500);
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const handleDecrement = (productId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Cart summary calculations
  const totalCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const allItemsHavePrice = useMemo(() => {
    return cartItems.length > 0 && cartItems.every((item) => item.unitPrice > 0);
  }, [cartItems]);

  // WhatsApp destination resolution
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER;
  const whatsAppUrl = useMemo(() => {
    return getWhatsAppOrderUrl(whatsAppNumber, cartItems, totalAmount);
  }, [whatsAppNumber, cartItems, totalAmount]);

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* Search Header */}
      <div className="p-3 border-b border-border/80 bg-background/95 sticky top-14 z-20 backdrop-blur">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari barang atau kategori..."
        />
      </div>

      {/* Category Chips Bar */}
      <CategoryChips
        categories={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        className="top-[116px]"
      />

      {/* Floating Stock Limit Notice */}
      {feedbackNotice && (
        <div className="fixed top-28 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top duration-200">
          <div className="bg-text text-surface px-3 py-1.5 rounded-full text-caption font-medium shadow-lg pointer-events-auto">
            {feedbackNotice}
          </div>
        </div>
      )}

      {/* Product Grid matching /jual 6-columns on mobile */}
      <main className="flex-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-subtle text-text-muted mb-3 border border-border">
              <PackageSearch className="w-6 h-6" />
            </div>
            <p className="text-body-medium font-medium text-text">
              Barang tidak ditemukan
            </p>
            <p className="text-caption text-text-muted mt-1 max-w-xs">
              {searchQuery
                ? `Tidak ada barang yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                : 'Tidak ada barang dalam kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="grid w-full min-w-0 max-w-full grid-cols-6 gap-1 p-1.5 box-border overflow-hidden">
            {filteredProducts.map((product) => (
              <PublicStockItem
                key={product.id}
                product={product}
                quantityInCart={getItemQuantity(product.id)}
                onSelect={handleSelectProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Subtle Customer Footer */}
      <footer className="p-4 text-center border-t border-border/40 text-caption text-text-muted mt-auto mb-16">
        <span>Informasi ketersediaan stok diperbarui secara berkala • Warung Dading</span>
      </footer>

      {/* Sticky Bottom Cart Summary Bar (when items are selected) */}
      {totalCount > 0 && (
        <aside
          aria-label="Ringkasan keranjang belanja"
          className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-3 pointer-events-none"
        >
          <div className="flex items-center justify-between w-full max-w-lg h-14 px-3.5 bg-text text-surface rounded-2xl shadow-xl pointer-events-auto transition-transform animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-surface/15 flex items-center justify-center text-surface shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-surface leading-tight truncate">
                  {totalCount} barang
                </span>
                <span className="text-[11px] text-surface/80 leading-tight truncate">
                  {allItemsHavePrice ? formatRupiah(totalAmount) : 'Estimasi via WhatsApp'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-caption font-bold shadow-xs hover:bg-primary-dark active:scale-95 transition-all"
            >
              <span>Keranjang</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </aside>
      )}

      {/* Public Cart Sheet Modal */}
      <PublicCartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onClear={handleClearCart}
        totalCount={totalCount}
        totalAmount={totalAmount}
        whatsAppUrl={whatsAppUrl}
        hasWhatsAppNumber={Boolean(whatsAppNumber)}
      />
    </div>
  );
}

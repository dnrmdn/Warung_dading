'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, SellingMode } from '@/types/warung';
import { HeaderBar } from '@/components/navigation/header-bar';
import { SearchBar } from '@/components/ui/search-bar';
import { CategoryChips } from '@/components/jual/category-chips';
import { ProductGrid } from '@/components/jual/product-grid';
import { SellingModeSheet } from '@/components/jual/selling-mode-sheet';
import { CartBottomSheet } from '@/components/jual/cart-bottom-sheet';
import { PaymentSheet } from '@/components/jual/payment-sheet';
import { createSaleAction } from '@/app/actions/sales';
import { formatRupiah } from '@/lib/format';
import { ShoppingBag, Search as SearchIcon, AlertCircle } from 'lucide-react';

interface PosContainerProps {
  initialProducts: Product[];
  categories: string[];
  isOpeningCashInitialized?: boolean;
}

export function PosContainer({
  initialProducts,
  categories,
  isOpeningCashInitialized = true,
}: PosContainerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sheet states
  const [selectedProductForMode, setSelectedProductForMode] = useState<Product | null>(null);
  const [isSellingModeOpen, setIsSellingModeOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  // Filter products by category and search query entirely client-side
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.family.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  // Map product id to current authoritative stock snapshot
  const productStockMap = useMemo(() => {
    return new Map(initialProducts.map((product) => [product.id, product.stock]));
  }, [initialProducts]);

  // Total quantity in cart for a specific product
  const getItemQuantity = (productId: string) => {
    return cartItems
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Add item helper
  const addItemToCart = (product: Product, mode: SellingMode) => {
    const currentStock = productStockMap.get(product.id) ?? product.stock;
    const currentTotalInCart = getItemQuantity(product.id);
    if (currentTotalInCart >= currentStock) {
      return;
    }

    const itemId = `${product.id}-${mode}`;
    const unitPrice =
      (mode === 'brewed' && product.preparedPrice
        ? product.preparedPrice
        : product.price) ?? 0;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          variant: product.variant,
          mode,
          unit: product.unit,
          unitPrice,
          quantity: 1,
          iconName: product.iconName,
        },
      ];
    });
  };

  // Handle product tap from grid
  const handleSelectProduct = (product: Product) => {
    if (product.preparedPrice) {
      // Open selling mode selector (Jual langsung vs Diseduh)
      setSelectedProductForMode(product);
      setIsSellingModeOpen(true);
    } else {
      // Standard product directly added
      addItemToCart(product, 'direct');
    }
  };

  // Handle selling mode chosen from sheet
  const handleSelectMode = (product: Product, mode: SellingMode) => {
    addItemToCart(product, mode);
    setIsSellingModeOpen(false);
    setSelectedProductForMode(null);
  };

  // Cart operations
  const handleIncrement = (itemId: string) => {
    const item = cartItems.find((ci) => ci.id === itemId);
    if (!item) return;

    const currentStock = productStockMap.get(item.productId) ?? 0;
    const currentTotalInCart = getItemQuantity(item.productId);
    if (currentTotalInCart >= currentStock) {
      return;
    }

    setCartItems((prev) =>
      prev.map((ci) =>
        ci.id === itemId ? { ...ci, quantity: ci.quantity + 1 } : ci
      )
    );
  };

  const handleDecrement = (itemId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleCheckoutClick = () => {
    setIsCartSheetOpen(false);
    setIsPaymentSheetOpen(true);
  };

  const handleConfirmPayment = async (
    paymentAmount: number,
    customerName?: string,
    customerPhone?: string
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Use local date (sv-SE locale produces YYYY-MM-DD in the device's local timezone)
      const today = new Date().toLocaleDateString('sv-SE');

      // Map cart items to the server action's CreateSaleItemInput shape.
      // productId contains the canonical DB Product.id
      const itemsForAction = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        mode: item.mode,
        unitPrice: item.unitPrice,
      }));

      const result = await createSaleAction({
        transactionDate: today,
        items: itemsForAction,
        paymentAmount,
        customerName,
        customerPhone,
      });

      if (result.success) {
        handleClearCart();
        setIsPaymentSheetOpen(false);
        router.replace('/dashboard');
      } else {
        alert(result.error?.message ?? 'Gagal membuat transaksi. Silakan coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh w-full min-w-0 max-w-lg mx-auto overflow-x-hidden bg-background text-text relative">
      {/* Top Header */}
      <HeaderBar
        title="Jual (POS)"
        subtitle={`${filteredProducts.length} produk`}
        backHref="/dashboard"
        rightAction={
          <button
            type="button"
            onClick={() => setShowSearch((prev) => !prev)}
            className="p-2 rounded-full text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors"
            aria-label="Cari produk"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        }
      />

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="px-3 py-2 bg-background border-b border-border/60 animate-in fade-in duration-150">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama produk atau merk..."
            autoFocus
          />
        </div>
      )}

      {/* Category Filter Chips */}
      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Non-blocking prompt if opening cash has not been entered */}
      {!isOpeningCashInitialized && (
        <div className="mx-3 mt-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-caption text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Saldo awal kasir belum ditentukan</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-[11px] font-bold underline shrink-0 hover:text-amber-900 dark:hover:text-amber-200"
          >
            Isi di Dashboard
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 min-w-0 w-full pb-24 overflow-x-hidden">
        <ProductGrid
          products={filteredProducts}
          getItemQuantity={getItemQuantity}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Floating Active Cart Summary Bar (when items selected) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
          <div className="flex items-center justify-between w-full max-w-sm h-14 px-3.5 bg-text text-background rounded-2xl shadow-xl pointer-events-auto animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-caption font-bold">
                {totalCartCount}
              </div>
              <div className="flex flex-col">
                <span className="text-caption text-background/70 leading-tight">
                  Total Transaksi
                </span>
                <span className="text-body-medium font-bold text-background leading-tight">
                  {formatRupiah(totalCartPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartSheetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bayar</span>
            </button>
          </div>
        </div>
      )}

      {/* Selling Mode Bottom Sheet (Jual langsung vs Diseduh) */}
      <SellingModeSheet
        product={selectedProductForMode}
        isOpen={isSellingModeOpen}
        onClose={() => {
          setIsSellingModeOpen(false);
          setSelectedProductForMode(null);
        }}
        onSelectMode={handleSelectMode}
      />

      {/* Cart Review Bottom Sheet */}
      <CartBottomSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        items={cartItems}
        productStockMap={productStockMap}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onClearCart={handleClearCart}
        onCheckout={handleCheckoutClick}
      />

      {/* Payment Bottom Sheet */}
      {isPaymentSheetOpen && (
        <PaymentSheet
          isOpen={isPaymentSheetOpen}
          onClose={() => setIsPaymentSheetOpen(false)}
          totalAmount={totalCartPrice}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
}

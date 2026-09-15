'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, ProductSaleHistoryItem } from '@/types/warung';
import { updateProductAction } from '@/app/actions/products';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { ProductIcon } from '@/components/ui/product-icon';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/format';
import {
  Calculator,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  History,
  ShoppingBag,
} from 'lucide-react';

interface ProductDetailClientProps {
  initialProduct: Product;
  salesHistory?: ProductSaleHistoryItem[];
}

export function ProductDetailClient({
  initialProduct,
  salesHistory = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const product = initialProduct;
  const isLowStock = product.stock <= product.minStock;
  const derivedHpp =
    product.hppComponents && product.hppComponents.length > 0
      ? product.hppComponents.reduce(
          (sum, c) => sum + c.quantity * c.unitCost,
          0
        )
      : product.costPrice;

  const grossProfit =
    product.price !== undefined && derivedHpp !== undefined
      ? product.price - derivedHpp
      : undefined;
  const marginPercent =
    grossProfit !== undefined && product.price
      ? Math.round((grossProfit / product.price) * 100)
      : undefined;

  const handleToggleStatus = () => {
    startTransition(async () => {
      const nextActive = !product.isActive;
      const res = await updateProductAction(product.id, { isActive: nextActive });
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error?.message || 'Gagal mengubah status produk');
      }
    });
  };

  return (
    <AppShell>
      <HeaderBar
        title={product.name}
        subtitle={product.category}
        backHref="/stok"
      />

      <div className="flex flex-col gap-3.5 px-4 py-4 w-full">
        {/* Top Product Header Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-surface-subtle text-primary border border-border/60 shrink-0">
            <ProductIcon name={product.iconName} className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-h2 text-text truncate">{product.name}</h2>
            </div>
            <p className="text-small text-text-secondary mt-0.5">
              Keluarga Produk: <span className="font-medium text-text">{product.family}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default">{product.category}</Badge>
              <Badge variant={product.isActive ? 'success' : 'muted'}>
                {product.isActive ? 'Aktif Dijual' : 'Nonaktif'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing & Gross Profit Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <h3 className="text-body-medium font-semibold text-text">Harga & Margin</h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-caption text-text-secondary block">Harga Jual</span>
              <span className="text-h3 font-bold text-primary block mt-0.5">
                {formatRupiah(product.price)}
              </span>
              <span className="text-caption text-text-muted mt-0.5 block">
                / {product.unit}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border/60">
              <span className="text-caption text-text-secondary block">HPP Pokok</span>
              <span className="text-h3 font-bold text-text block mt-0.5">
                {formatRupiah(derivedHpp)}
              </span>
              <span className="text-caption text-text-muted mt-0.5 block">
                Modal dasar
              </span>
            </div>
          </div>

          {/* Prepared Selling Price if available */}
          {product.preparedPrice && (
            <div className="p-3 rounded-xl bg-primary-soft/20 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-caption font-medium text-primary-dark block">
                  Harga Diseduh / Masak
                </span>
                <span className="text-body-medium font-bold text-primary block mt-0.5">
                  {formatRupiah(product.preparedPrice)}
                </span>
              </div>
              <Badge variant="primary">Siap Saji</Badge>
            </div>
          )}

          {/* Estimated Gross Profit Summary */}
          {grossProfit !== undefined && marginPercent !== undefined && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-small">
              <span className="text-text-secondary">Estimasi Laba Kotor:</span>
              <span className="font-bold text-success">
                {formatRupiah(grossProfit)} ({marginPercent}%)
              </span>
            </div>
          )}
        </div>

        {/* Stock Information Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <h3 className="text-body-medium font-semibold text-text">Informasi Stok</h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-caption text-text-secondary">Stok Saat Ini</span>
              <span className="text-h2 font-bold text-text mt-0.5">
                {product.stock}{' '}
                <span className="text-body font-normal text-text-muted">
                  {product.unit}
                </span>
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-caption text-text-secondary">Batas Minimum</span>
              <span className="text-body-medium font-medium text-text mt-0.5">
                {product.minStock} {product.unit}
              </span>
            </div>
          </div>

          {isLowStock ? (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-warning-soft text-warning text-small border border-warning/30">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Stok telah mencapai batas minimum.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success-soft text-success text-small border border-success/30">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Stok dalam batas aman.</span>
            </div>
          )}
        </div>

        {/* Link to HPP / Recipe breakdown */}
        <Link
          href={`/hpp/${product.id}`}
          className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border hover:border-primary/60 transition-all group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-soft text-primary-dark">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-body-medium font-semibold text-text group-hover:text-primary transition-colors">
                Rincian HPP & Resep
              </h4>
              <p className="text-caption text-text-secondary">
                Lihat komponen biaya modal & bahan
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
        </Link>

        {/* Active Toggle Control */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div>
            <h4 className="text-body-medium font-semibold text-text">Status Produk</h4>
            <p className="text-caption text-text-secondary">
              Tampilkan di grid penjualan POS
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isPending}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors relative ${
              product.isActive ? 'bg-primary' : 'bg-border'
            } ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label="Toggle status aktif"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform flex items-center justify-center ${
                product.isActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {isPending && <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" />}
            </div>
          </button>
        </div>

        {/* Riwayat Penjualan Produk */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-body-medium font-semibold text-text">
                Riwayat Penjualan Terakhir
              </h3>
            </div>
            <span className="text-caption text-text-muted">
              {salesHistory.length} transaksi
            </span>
          </div>

          {salesHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted gap-2">
              <ShoppingBag className="w-8 h-8 stroke-1 text-text-muted/60" />
              <p className="text-small">Belum ada transaksi penjualan untuk produk ini</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {salesHistory.map((item, idx) => (
                <div key={`${item.saleId}-${idx}`} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption font-semibold text-text">
                        {item.transactionNumber}
                      </span>
                      <Badge
                        variant={
                          item.paymentStatus === 'paid'
                            ? 'success'
                            : item.paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {item.paymentStatus === 'paid'
                          ? 'Lunas'
                          : item.paymentStatus === 'partial'
                          ? 'Sebagian'
                          : 'Piutang'}
                      </Badge>
                    </div>
                    <span className="text-body-medium font-bold text-text">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-caption text-text-secondary">
                    <span>
                      {item.quantity} {product.unit} × {formatRupiah(item.unitPrice)}
                      {item.mode === 'brewed' && ' (Seduh)'}
                    </span>
                    <span>{item.transactionDate}</span>
                  </div>

                  {item.customerName && (
                    <div className="text-xs text-text-muted">
                      Pelanggan: <span className="text-text font-medium">{item.customerName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Purchase } from '@/types/warung';
import { PurchaseItemCard } from '@/components/pembelian/purchase-item-card';
import { PurchaseDetailSheet } from '@/components/pembelian/purchase-detail-sheet';
import { ShoppingBag, Plus } from 'lucide-react';

interface PurchaseListClientProps {
  purchases: Purchase[];
}

export function PurchaseListClient({ purchases }: PurchaseListClientProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  function handleCardClick(purchase: Purchase) {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  }

  function handleDetailOpenChange(open: boolean) {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedPurchase(null);
    }
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-subtle border border-border">
          <ShoppingBag className="w-8 h-8 text-text-muted stroke-[1.5]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-body-medium font-semibold text-text">Belum ada catatan pembelian</p>
          <p className="text-small text-text-secondary">
            Catat transaksi belanja stok untuk melacak pengeluaran & stok masuk.
          </p>
        </div>
        <Link
          href="/pembelian/baru"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Catat Pembelian Baru
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-0.5">
          Riwayat Transaksi
        </h2>
        <div className="flex flex-col gap-2">
          {purchases.map((purchase) => (
            <PurchaseItemCard
              key={purchase.id}
              purchase={purchase}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      <PurchaseDetailSheet
        purchase={selectedPurchase}
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </>
  );
}

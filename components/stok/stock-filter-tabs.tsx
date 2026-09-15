'use client';

import React from 'react';
import { InventoryType } from '@/types/warung';
import { cn } from '@/lib/utils';

export type StockFilterTab = 'semua' | InventoryType;

interface StockFilterTabsProps {
  selectedTab: StockFilterTab;
  onSelectTab: (tab: StockFilterTab) => void;
  className?: string;
}

export function StockFilterTabs({
  selectedTab,
  onSelectTab,
  className,
}: StockFilterTabsProps) {
  const tabs: { key: StockFilterTab; label: string }[] = [
    { key: 'semua', label: 'Semua' },
    { key: 'barang', label: 'Barang' },
    { key: 'bahan', label: 'Bahan' },
    { key: 'produk_jadi', label: 'Produk jadi' },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-0.5 h-8 bg-surface-subtle border border-border rounded-xl w-full',
        className
      )}
    >
      {tabs.map((tab) => {
        const isSelected = selectedTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={cn(
              'flex items-center justify-center flex-1 h-7 px-1.5 rounded-lg text-[11px] font-medium transition-all text-center whitespace-nowrap leading-none',
              isSelected
                ? 'bg-surface text-text font-semibold shadow-2xs border border-border/40'
                : 'text-text-secondary hover:text-text'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

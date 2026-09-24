import React from 'react';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingJual() {
  return (
    <div className="flex flex-col min-h-dvh w-full min-w-0 max-w-lg mx-auto overflow-x-hidden bg-background text-text relative animate-pulse">
      {/* Header Bar */}
      <HeaderBar
        title="Jual (POS)"
        subtitle="Memuat produk..."
        backHref="/dashboard"
      />

      {/* Category Filter Chips Skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-hidden border-b border-border/60">
        <div className="h-8 w-16 rounded-full bg-primary/20 shrink-0" />
        <div className="h-8 w-20 rounded-full bg-surface-subtle shrink-0" />
        <div className="h-8 w-18 rounded-full bg-surface-subtle shrink-0" />
        <div className="h-8 w-24 rounded-full bg-surface-subtle shrink-0" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="flex-1 min-w-0 w-full p-4 pb-24 overflow-x-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-3 rounded-2xl bg-surface border border-border shadow-2xs gap-2.5"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-subtle shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 w-full">
                <div className="h-4 w-3/4 bg-surface-subtle rounded" />
                <div className="h-3 w-1/2 bg-surface-subtle rounded" />
                <div className="h-4 w-2/3 bg-surface-subtle rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingPublicStock() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col max-w-lg mx-auto border-x border-border/40">
      <HeaderBar
        title="Warung Dading"
        subtitle="Memuat stok barang..."
      />

      <div className="flex flex-col animate-pulse">
        {/* Search Bar Skeleton */}
        <div className="p-3 border-b border-border/80">
          <div className="h-9 w-full bg-surface rounded-xl border border-border"></div>
        </div>

        {/* Category Chips Skeleton */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 overflow-hidden">
          <div className="h-7 w-16 bg-surface rounded-full"></div>
          <div className="h-7 w-20 bg-surface rounded-full"></div>
          <div className="h-7 w-24 bg-surface rounded-full"></div>
          <div className="h-7 w-16 bg-surface rounded-full"></div>
        </div>

        {/* Product Items Skeleton */}
        <div className="p-3 flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-surface border border-border/70 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-subtle shrink-0"></div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 bg-surface-subtle rounded"></div>
                  <div className="h-3 w-20 bg-surface-subtle rounded"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-surface-subtle rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

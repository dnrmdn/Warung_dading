import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingStok() {
  return (
    <AppShell>
      <HeaderBar
        title="Stok"
        subtitle="Memuat item stok..."
      />

      <div className="flex flex-col gap-3 p-4 animate-pulse">
        {/* Search Input Skeleton */}
        <div className="h-11 w-full bg-surface-subtle rounded-xl" />

        {/* Filter Tabs Skeleton */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl overflow-x-hidden">
          <div className="h-8 flex-1 bg-surface rounded-lg" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-lg" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-lg" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-lg" />
        </div>

        {/* Stock Item Rows Skeleton */}
        <div className="flex flex-col gap-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border shadow-2xs gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-subtle shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="h-4 w-1/2 bg-surface-subtle rounded" />
                <div className="h-3 w-1/3 bg-surface-subtle rounded" />
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="h-4 w-16 bg-surface-subtle rounded" />
                <div className="h-3 w-10 bg-surface-subtle rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

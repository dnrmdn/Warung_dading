import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingSupplier() {
  return (
    <AppShell>
      <HeaderBar
        title="Supplier"
        subtitle="Memuat supplier..."
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 animate-pulse">
        {/* Supplier Stats Card Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-36 bg-surface-subtle rounded" />
            <div className="h-3 w-16 bg-surface-subtle rounded" />
          </div>

          <div className="flex items-baseline gap-2">
            <div className="h-8 w-24 bg-surface-subtle rounded" />
            <div className="h-3 w-12 bg-surface-subtle rounded" />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <div className="w-7 h-7 rounded-lg bg-surface-subtle shrink-0" />
            <div className="h-3 w-48 bg-surface-subtle rounded" />
          </div>
        </div>

        {/* Supplier List Skeleton */}
        <div className="flex flex-col gap-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-surface-subtle rounded" />
                <div className="h-4 w-12 bg-surface-subtle rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <div className="h-3 w-28 bg-surface-subtle rounded" />
                <div className="h-3 w-20 bg-surface-subtle rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

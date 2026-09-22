import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingPengeluaran() {
  return (
    <AppShell>
      <HeaderBar
        title="Pengeluaran"
        subtitle="Memuat pengeluaran..."
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 animate-pulse">
        {/* Monthly Summary Card Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-36 bg-surface-subtle rounded" />
            <div className="h-3 w-20 bg-surface-subtle rounded" />
          </div>

          <div className="flex items-baseline gap-2">
            <div className="h-8 w-40 bg-surface-subtle rounded" />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <div className="w-7 h-7 rounded-lg bg-surface-subtle shrink-0" />
            <div className="h-3 w-32 bg-surface-subtle rounded" />
          </div>
        </div>

        {/* Expense List Skeleton */}
        <div className="flex flex-col gap-2 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border shadow-2xs gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-subtle shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="h-4 w-1/2 bg-surface-subtle rounded" />
                <div className="h-3 w-1/3 bg-surface-subtle rounded" />
              </div>
              <div className="h-4 w-20 bg-surface-subtle rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

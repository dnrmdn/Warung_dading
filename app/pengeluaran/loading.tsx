import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function PengeluaranLoading() {
  return (
    <AppShell>
      <HeaderBar
        title="Pengeluaran"
        subtitle="Memuat data..."
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 animate-pulse">
        {/* Monthly Summary Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-surface-subtle rounded" />
            <div className="h-3 w-20 bg-surface-subtle rounded" />
          </div>
          <div className="h-8 w-40 bg-surface-subtle rounded my-1" />
          <div className="pt-2 border-t border-border/60 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-subtle" />
            <div className="h-3 w-36 bg-surface-subtle rounded" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 bg-surface-subtle rounded px-0.5" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-surface border border-border/80 p-3.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-subtle shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 bg-surface-subtle rounded" />
                  <div className="h-2.5 w-1/2 bg-surface-subtle rounded" />
                </div>
                <div className="h-4 w-20 bg-surface-subtle rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingTransaksi() {
  return (
    <AppShell>
      <HeaderBar
        title="Transaksi"
        subtitle="Memuat transaksi..."
        backHref="/"
      />

      <div className="flex flex-col gap-4 p-4 pb-24 animate-pulse">
        {/* Today's Summary KPI Cards Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-2">
            <div className="h-4 w-24 bg-surface-subtle rounded" />
            <div className="h-6 w-32 bg-surface-subtle rounded" />
            <div className="h-3 w-20 bg-surface-subtle rounded" />
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-2">
            <div className="h-4 w-28 bg-surface-subtle rounded" />
            <div className="h-6 w-16 bg-surface-subtle rounded" />
            <div className="h-3 w-24 bg-surface-subtle rounded" />
          </div>
        </div>

        {/* Transaction Cards List Skeleton */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <div className="h-4 w-28 bg-surface-subtle rounded" />
            <div className="h-3 w-20 bg-surface-subtle rounded" />
          </div>

          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-surface-subtle rounded" />
                  <div className="h-5 w-16 bg-surface-subtle rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="h-5 w-24 bg-surface-subtle rounded" />
                  <div className="h-3 w-16 bg-surface-subtle rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

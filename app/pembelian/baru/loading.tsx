import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingPembelianBaru() {
  return (
    <AppShell>
      <HeaderBar
        title="Catat Pembelian"
        subtitle="Memuat form..."
        backHref="/pembelian"
      />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-36 animate-pulse">
        {/* Info Pembelian Card Skeleton */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-border">
          <div className="h-4 w-28 bg-surface-subtle rounded" />
          <div className="h-10 w-full bg-surface-subtle rounded-xl" />
          <div className="h-10 w-full bg-surface-subtle rounded-xl" />
        </div>

        {/* Daftar Barang Belanja Skeleton */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-surface-subtle rounded" />
            <div className="h-8 w-28 bg-surface-subtle rounded-xl" />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/60 border border-border/40 gap-3"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-4 w-3/5 bg-surface-subtle rounded" />
                  <div className="h-3 w-2/5 bg-surface-subtle rounded" />
                </div>
                <div className="h-8 w-20 bg-surface-subtle rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

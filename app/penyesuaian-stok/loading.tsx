import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function PenyesuaianStokLoading() {
  return (
    <AppShell>
      <HeaderBar
        title="Riwayat Penyesuaian Stok"
        subtitle="Memuat riwayat..."
        backHref="/more"
      />

      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full animate-pulse">
        {[1, 2].map((section) => (
          <div key={section} className="flex flex-col gap-2">
            <div className="h-3 w-36 bg-surface-subtle rounded px-1" />
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-surface border border-border/80 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-surface-subtle rounded" />
                    <div className="h-3 w-12 bg-surface-subtle rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 bg-surface-subtle rounded" />
                    <div className="h-4 w-12 bg-surface-subtle rounded" />
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <div className="h-3 w-16 bg-surface-subtle rounded" />
                    <div className="h-3 w-28 bg-surface-subtle rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

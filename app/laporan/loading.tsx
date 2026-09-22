import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LoadingLaporan() {
  return (
    <AppShell>
      <HeaderBar
        title="Laporan Bisnis"
        subtitle="Memuat analitik..."
      />

      <div className="flex flex-col gap-4 p-4 pb-20 animate-pulse">
        {/* Period Selector Skeleton */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-subtle rounded-2xl overflow-x-hidden">
          <div className="h-8 flex-1 bg-surface rounded-xl" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-xl" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-xl" />
          <div className="h-8 flex-1 bg-surface-subtle/50 rounded-xl" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-surface-subtle rounded" />
                <div className="w-6 h-6 rounded-lg bg-surface-subtle" />
              </div>
              <div className="h-6 w-28 bg-surface-subtle rounded" />
              <div className="h-3 w-16 bg-surface-subtle rounded" />
            </div>
          ))}
        </div>

        {/* Trend Chart Card Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-surface-subtle rounded" />
            <div className="h-3 w-20 bg-surface-subtle rounded" />
          </div>
          <div className="h-44 w-full bg-surface-subtle/60 rounded-xl" />
        </div>

        {/* Breakdown Card Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col gap-3">
          <div className="h-4 w-36 bg-surface-subtle rounded" />
          <div className="flex flex-col gap-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="h-3 w-24 bg-surface-subtle rounded" />
                <div className="h-3 w-20 bg-surface-subtle rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

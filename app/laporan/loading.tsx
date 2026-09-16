import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';

export default function LaporanLoading() {
  return (
    <AppShell>
      <HeaderBar
        title="Laporan Bisnis"
        subtitle="Memuat analitik data..."
      />

      <div className="flex flex-col gap-4 p-4 pb-20 animate-pulse">
        {/* Filter Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-hidden py-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 h-8 rounded-full bg-surface border border-border" />
          ))}
        </div>

        {/* Date Banner Skeleton */}
        <div className="w-full h-8 rounded-xl bg-surface-subtle border border-border" />

        {/* 6 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-surface border border-border p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="w-20 h-3.5 rounded bg-surface-subtle" />
                <div className="w-7 h-7 rounded-lg bg-surface-subtle" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="w-28 h-6 rounded bg-surface-subtle" />
                <div className="w-16 h-3 rounded bg-surface-subtle" />
              </div>
            </div>
          ))}
        </div>

        {/* Trend Chart Skeleton */}
        <div className="h-64 rounded-2xl bg-surface border border-border p-5 flex flex-col justify-between">
          <div className="w-36 h-5 rounded bg-surface-subtle" />
          <div className="w-full h-40 rounded-xl bg-surface-subtle" />
        </div>

        {/* 2 Column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-surface border border-border p-5" />
          <div className="h-72 rounded-2xl bg-surface border border-border p-5" />
        </div>
      </div>
    </AppShell>
  );
}

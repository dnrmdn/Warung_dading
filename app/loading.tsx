import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { Badge } from '@/components/ui/badge';

export default function LoadingDashboard() {
  return (
    <AppShell>
      {/* Top Header */}
      <HeaderBar
        title="Warung Smart"
        subtitle="Memuat data..."
        rightAction={
          <Badge variant="success" className="px-2 py-0.5 text-caption opacity-50">
            Buka
          </Badge>
        }
      />

      <div className="flex flex-col gap-4 p-4 animate-pulse">
        {/* Today's Metrics Overview Card Skeleton */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <span className="text-caption text-text-muted">Real-time</span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="h-10 w-40 bg-surface-subtle rounded-md"></div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <div className="p-2.5 rounded-xl bg-surface-subtle flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle shrink-0"></div>
              <div className="flex flex-col gap-1 w-full">
                <div className="h-3 w-12 bg-surface-subtle rounded"></div>
                <div className="h-5 w-20 bg-surface-subtle rounded"></div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-subtle shrink-0"></div>
              <div className="flex flex-col gap-1 w-full">
                <div className="h-3 w-16 bg-surface-subtle rounded"></div>
                <div className="h-5 w-16 bg-surface-subtle rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts Skeleton */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/50">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 shrink-0"></div>
            <div className="flex flex-col gap-1 w-full">
              <div className="h-5 w-20 bg-white/30 rounded"></div>
              <div className="h-3 w-16 bg-white/30 rounded"></div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-subtle shrink-0"></div>
            <div className="flex flex-col gap-1 w-full">
              <div className="h-5 w-16 bg-surface-subtle rounded"></div>
              <div className="h-3 w-12 bg-surface-subtle rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

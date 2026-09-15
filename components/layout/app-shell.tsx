'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { JualFab } from '@/components/navigation/jual-fab';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  showNav?: boolean;
}

export function AppShell({ children, className, showNav = true }: AppShellProps) {
  const pathname = usePathname();
  const isMainTab = pathname === '/' || pathname === '/stok' || pathname === '/more' || pathname === '/laporan';

  return (
    <div className="flex flex-col min-h-dvh w-full max-w-lg mx-auto bg-background text-text relative shadow-sm border-x border-border/30">
      <main className={cn('flex-1 pb-24', !isMainTab && 'pb-16', className)}>
        {children}
      </main>

      {/* Primary Floating Action Button (Jual) */}
      <JualFab />

      {/* Floating Bottom Navigation (Home, Stok, More) */}
      {showNav && isMainTab && <BottomNav />}
    </div>
  );
}

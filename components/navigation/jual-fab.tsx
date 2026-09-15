'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export function JualFab() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user as unknown as { role?: string })?.role;

  // Hide FAB if currently on the Jual screen or user is OWNER
  if (pathname === '/jual' || userRole === 'OWNER') return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:right-[max(1rem,calc((100vw-480px)/2+1rem))]">
      <Link
        href="/jual"
        className={cn(
          'flex items-center gap-2 px-4 h-12 rounded-full bg-primary text-white font-medium shadow-xl hover:bg-primary-dark active:scale-95 transition-all',
          'border border-primary-dark/20'
        )}
        aria-label="Buka Menu Jual"
      >
        <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
        <span className="text-body-medium font-semibold">Jual</span>
      </Link>
    </div>
  );
}

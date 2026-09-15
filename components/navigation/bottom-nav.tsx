'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, MoreHorizontal, BarChart3 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const userRole = (session?.user as unknown as { role?: string })?.role;
  const isOwner = userRole === 'OWNER';

  // Navigation items customized by role
  const navItems = isOwner
    ? [
        {
          label: 'Laporan',
          href: '/laporan',
          icon: BarChart3,
          isActive: pathname === '/laporan',
        },
        {
          label: 'More',
          href: '/more',
          icon: MoreHorizontal,
          isActive: pathname.startsWith('/more'),
        },
      ]
    : [
        {
          label: 'Home',
          href: '/',
          icon: Home,
          isActive: pathname === '/',
        },
        {
          label: 'Stok',
          href: '/stok',
          icon: Package,
          isActive: pathname.startsWith('/stok'),
        },
        {
          label: 'More',
          href: '/more',
          icon: MoreHorizontal,
          isActive: pathname.startsWith('/more'),
        },
      ];

  return (
    <nav className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center justify-between w-full max-w-sm h-14 px-3 bg-surface/95 backdrop-blur border border-border rounded-full shadow-lg pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 rounded-full text-[11px] font-medium transition-colors',
                item.isActive
                  ? 'text-primary font-semibold'
                  : 'text-text-secondary hover:text-text'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', item.isActive ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

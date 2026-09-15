'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { authClient } from '@/lib/auth-client';
import {
  Package,
  Calculator,
  ShoppingBag,
  Receipt,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Store,
  LogOut,
  Loader2,
  Shield,
  CreditCard,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  href?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MoreClientProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function MoreClient({ initialUser }: MoreClientProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = session?.user?.name || initialUser.name;
  const userRole = (session?.user as unknown as { role?: string })?.role || initialUser.role;
  const isOwner = userRole === 'OWNER';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const businessItems: MenuItem[] = isOwner
    ? []
    : [
        {
          icon: Package,
          label: 'Produk',
          description: 'Katalog barang & harga jual',
          href: '/stok',
        },
        {
          icon: Calculator,
          label: 'HPP',
          description: 'Rincian modal pokok & resep',
          href: '/stok',
        },
        {
          icon: ShoppingBag,
          label: 'Pembelian',
          description: 'Riwayat belanja stok masuk',
          href: '/pembelian',
        },
        {
          icon: Receipt,
          label: 'Pengeluaran',
          description: 'Catatan operasional warung',
          href: '/pengeluaran',
        },
        {
          icon: Users,
          label: 'Supplier',
          description: 'Kontak agen & distributor',
          href: '/supplier',
        },
        {
          icon: CreditCard,
          label: 'Piutang Pelanggan',
          description: 'Daftar tagihan belum lunas & pelunasan',
          href: '/piutang',
        },
      ];

  const sections: MenuSection[] = [
    ...(businessItems.length > 0
      ? [
          {
            title: 'Bisnis',
            items: businessItems,
          },
        ]
      : []),
    {
      title: 'Analitik',
      items: [
        {
          icon: BarChart3,
          label: 'Laporan',
          description: 'Ringkasan omzet & laba rugi',
          href: '/laporan',
        },
      ],
    },
    {
      title: 'Sistem',
      items: [
        {
          icon: Settings,
          label: 'Pengaturan',
          description: 'Profil warung & preferensi aplikasi',
        },
      ],
    },
  ];

  return (
    <AppShell>
      <HeaderBar title="Menu Lainnya" />

      <div className="flex flex-col gap-4 p-4">
        {/* Warung Profile Header Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-soft text-primary-dark">
            <Store className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-body-medium font-bold text-text truncate">
              {userName || 'Warung Smart'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-caption font-semibold text-primary uppercase">
                Peran: {userRole || 'PENGGUNA'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Sections: Bisnis, Analitik, Sistem */}
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <h3 className="text-caption font-semibold text-text-secondary uppercase tracking-wider px-1">
              {section.title}
            </h3>

            <div className="flex flex-col bg-surface rounded-2xl border border-border divide-y divide-border/60 overflow-hidden">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-subtle text-text-secondary group-hover:text-primary group-hover:bg-primary-soft/30 transition-colors shrink-0">
                        <Icon className="w-5 h-5 stroke-[1.8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-body-medium font-medium text-text block group-hover:text-primary transition-colors">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-caption text-text-secondary block truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                  </div>
                );

                return item.href ? (
                  <Link key={itemIdx} href={item.href}>
                    {content}
                  </Link>
                ) : (
                  <div key={itemIdx}>{content}</div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Section */}
        <div className="mt-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-danger-soft/60 border border-danger/20 text-danger font-semibold text-small hover:bg-danger-soft active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Keluar dari sistem...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun (Logout)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

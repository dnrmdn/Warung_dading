import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { getSuppliers } from '@/lib/services/suppliers';
import { SupplierListClient } from '@/components/supplier/supplier-list-client';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { Plus, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SupplierPage() {
  await enforceAdminPage();
  const suppliers = await getSuppliers();

  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <AppShell>
      <HeaderBar
        title="Supplier"
        subtitle={`${suppliers.length} supplier terdaftar`}
        backHref="/more"
        rightAction={
          <Link
            href="/supplier/baru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs"
            aria-label="Tambah supplier baru"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah</span>
          </Link>
        }
      />

      <div className="flex flex-col gap-4 p-4">
        {/* Supplier Stats Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Total Mitra Pemasok
            </span>
            <span className="text-caption text-text-muted">
              {activeCount} Aktif
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-display font-bold text-text">
              {suppliers.length}
            </span>
            <span className="text-caption text-text-muted">kontak</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-caption text-text-secondary">
              Kelola daftar agen dan distributor belanja warung
            </span>
          </div>
        </div>

        {/* Supplier List */}
        <SupplierListClient initialSuppliers={suppliers} />
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { Supplier } from '@/types/warung';
import { SupplierCard } from '@/components/supplier/supplier-card';
import { SupplierDetailSheet } from '@/components/supplier/supplier-detail-sheet';
import { Search, Users } from 'lucide-react';
import Link from 'next/link';

interface SupplierListClientProps {
  initialSuppliers: Supplier[];
}

export function SupplierListClient({ initialSuppliers }: SupplierListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return initialSuppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.isActive) ||
        (statusFilter === 'inactive' && !s.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [initialSuppliers, searchQuery, statusFilter]);

  const handleCardClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, no. telp, alamat..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-caption font-medium transition-all text-center ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Semua ({initialSuppliers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-caption font-medium transition-all text-center ${
              statusFilter === 'active'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Aktif ({initialSuppliers.filter((s) => s.isActive).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-caption font-medium transition-all text-center ${
              statusFilter === 'inactive'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Nonaktif ({initialSuppliers.filter((s) => !s.isActive).length})
          </button>
        </div>
      </div>

      {/* Supplier List */}
      {filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-surface border border-border text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center text-text-muted mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-body font-semibold text-text mb-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Tidak ada supplier yang cocok'
              : 'Belum ada supplier'}
          </p>
          <p className="text-caption text-text-muted max-w-xs mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Coba ubah kata kunci pencarian atau filter status Anda'
              : 'Tambahkan supplier langganan untuk memudahkan pencatatan belanja warung Anda.'}
          </p>
          {initialSuppliers.length === 0 && (
            <Link
              href="/supplier/baru"
              className="px-4 py-2 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark transition-all"
            >
              Tambah Supplier Pertama
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Detail & Edit Bottom Sheet */}
      <SupplierDetailSheet
        supplier={selectedSupplier}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedSupplier(null);
        }}
      />
    </div>
  );
}

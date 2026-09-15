'use client';

import React from 'react';
import { Supplier } from '@/types/warung';
import { Phone, MapPin, ChevronRight } from 'lucide-react';

interface SupplierCardProps {
  supplier: Supplier;
  onClick: (supplier: Supplier) => void;
}

export function SupplierCard({ supplier, onClick }: SupplierCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(supplier)}
      className="w-full text-left flex items-center gap-3 p-3.5 bg-surface rounded-xl border border-border/80 hover:border-primary/40 hover:shadow-2xs active:scale-[0.99] transition-all group"
      aria-label={`Lihat detail supplier ${supplier.name}`}
    >
      {/* Avatar initial */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-soft text-primary font-bold text-body-medium shrink-0">
        {supplier.name.charAt(0).toUpperCase()}
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Name + status */}
        <div className="flex items-center gap-2">
          <span className="text-body-medium font-semibold text-text truncate block">
            {supplier.name}
          </span>
          {!supplier.isActive && (
            <span className="text-[10px] font-semibold text-text-muted bg-surface-subtle border border-border/60 rounded px-1.5 py-0.5 shrink-0">
              Nonaktif
            </span>
          )}
        </div>

        {/* Row 2: Phone + Address */}
        <div className="flex items-center gap-3 mt-0.5 min-w-0">
          {supplier.phone && (
            <div className="flex items-center gap-1 text-caption text-text-secondary truncate">
              <Phone className="w-3 h-3 shrink-0" />
              <span className="truncate">{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-1 text-caption text-text-muted truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{supplier.address}</span>
            </div>
          )}
          {!supplier.phone && !supplier.address && (
            <span className="text-caption text-text-muted italic">
              Belum ada kontak
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
}

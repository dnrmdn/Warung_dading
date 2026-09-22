'use client';

import React, { useState } from 'react';
import { TodayCashPosition } from '@/types/warung';
import { formatRupiah } from '@/lib/format';
import { OpeningCashSheet } from '@/components/cash/opening-cash-sheet';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  PlusCircle,
  AlertCircle,
  Banknote,
} from 'lucide-react';

interface CashPositionCardProps {
  cashPosition: TodayCashPosition;
}

export function CashPositionCard({ cashPosition }: CashPositionCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // If opening cash is NOT yet initialized for today
  if (!cashPosition.isInitialized) {
    return (
      <>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                <AlertCircle className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-caption font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Kasir Belum Dibuka
                </span>
                <p className="text-caption text-text-secondary mt-0.5 leading-snug">
                  Saldo awal uang fisik di laci kasir belum diisi hari ini.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-caption font-bold hover:bg-primary-dark active:scale-95 transition-all shrink-0 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.2]" />
              <span>Isi Saldo</span>
            </button>
          </div>

          {/* If there are already sales or expenses recorded prior to opening cash */}
          {(cashPosition.cashIn > 0 || cashPosition.cashOut > 0) && (
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-caption text-text-secondary">
              <span>Aktivitas Kas Hari Ini:</span>
              <span className="font-semibold text-text">
                +{formatRupiah(cashPosition.cashIn)} / -{formatRupiah(cashPosition.cashOut)}
              </span>
            </div>
          )}
        </div>

        <OpeningCashSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          isInitialized={false}
          currentOpeningCash={0}
          targetDateStr={cashPosition.date}
        />
      </>
    );
  }

  // If opening cash IS initialized
  return (
    <>
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3.5 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-soft text-primary-dark">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-caption font-bold text-text-secondary uppercase tracking-wider block">
                Posisi Kas Laci Hari Ini
              </span>
              <span className="text-[11px] text-text-muted">
                {cashPosition.openingNote ? `Catatan: ${cashPosition.openingNote}` : 'Uang fisik terekspektasi di kasir'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-border text-text-secondary hover:text-text text-caption font-semibold transition-all active:scale-95"
            aria-label="Ubah saldo awal"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Ubah</span>
          </button>
        </div>

        {/* Big Expected Drawer Cash */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline justify-between">
            <span className="text-display font-bold text-text">
              {formatRupiah(cashPosition.expectedCash)}
            </span>
            <span className="text-[11px] font-medium text-success bg-success-soft px-2 py-0.5 rounded-full">
              Seharusnya di Laci
            </span>
          </div>
        </div>

        {/* 3 Component Breakdown Columns */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border/60">
          {/* Saldo Awal */}
          <div className="p-2.5 rounded-xl bg-surface-subtle flex flex-col gap-1">
            <div className="flex items-center gap-1 text-text-muted">
              <Banknote className="w-3.5 h-3.5 stroke-[2]" />
              <span className="text-[11px] font-medium">Saldo Awal</span>
            </div>
            <span className="text-small font-bold text-text truncate">
              {formatRupiah(cashPosition.openingCash)}
            </span>
          </div>

          {/* Kas Masuk */}
          <div className="p-2.5 rounded-xl bg-success-soft/30 flex flex-col gap-1">
            <div className="flex items-center gap-1 text-success">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px] font-semibold">Kas Masuk</span>
            </div>
            <span className="text-small font-bold text-success truncate">
              +{formatRupiah(cashPosition.cashIn)}
            </span>
          </div>

          {/* Kas Keluar */}
          <div className="p-2.5 rounded-xl bg-danger-soft/30 flex flex-col gap-1">
            <div className="flex items-center gap-1 text-danger">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="text-[11px] font-semibold">Kas Keluar</span>
            </div>
            <span className="text-small font-bold text-danger truncate">
              -{formatRupiah(cashPosition.cashOut)}
            </span>
          </div>
        </div>
      </div>

      <OpeningCashSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        isInitialized={true}
        currentOpeningCash={cashPosition.openingCash}
        currentNote={cashPosition.openingNote}
        targetDateStr={cashPosition.date}
      />
    </>
  );
}

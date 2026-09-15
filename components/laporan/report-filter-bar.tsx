'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReportPeriod } from '@/lib/services/reports';
import { cn } from '@/lib/utils';
import { Calendar, Filter, X, Check } from 'lucide-react';

interface ReportFilterBarProps {
  currentPeriod: ReportPeriod;
  startDateStr: string;
  endDateStr: string;
  periodLabel: string;
}

interface PeriodTab {
  id: ReportPeriod;
  label: string;
}

const PERIOD_TABS: PeriodTab[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'last7days', label: '7 Hari' },
  { id: 'thisMonth', label: 'Bulan Ini' },
  { id: 'lastMonth', label: 'Bulan Lalu' },
  { id: 'custom', label: 'Kustom' },
];

export function ReportFilterBar({
  currentPeriod,
  startDateStr,
  endDateStr,
  periodLabel,
}: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDateStr);
  const [customEnd, setCustomEnd] = useState(endDateStr);

  const handleSelectPeriod = (period: ReportPeriod) => {
    if (period === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }

    const params = new URLSearchParams();
    params.set('period', period);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;

    const params = new URLSearchParams();
    params.set('period', 'custom');
    params.set('startDate', customStart);
    params.set('endDate', customEnd);

    setIsCustomModalOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Scrollable Tab Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {PERIOD_TABS.map((tab) => {
          const isActive = currentPeriod === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectPeriod(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-small font-semibold whitespace-nowrap transition-all select-none',
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-border text-text-secondary hover:text-text hover:border-primary/40 active:scale-95'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Range Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-subtle border border-border/80 text-caption">
        <div className="flex items-center gap-1.5 text-text-secondary font-medium">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Periode:</span>
          <strong className="text-text font-semibold">{periodLabel}</strong>
        </div>
        {currentPeriod === 'custom' && (
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="text-primary font-semibold hover:underline"
          >
            Ubah Tanggal
          </button>
        )}
      </div>

      {/* Custom Date Range Modal Dialog */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-soft text-primary-dark">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-h3 text-text">Pilih Rentang Tanggal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-text-secondary">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd || undefined}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border text-body text-text focus:outline-hidden focus:border-primary font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-text-secondary">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || undefined}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border text-body text-text focus:outline-hidden focus:border-primary font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-small font-semibold text-text-secondary hover:bg-surface-subtle transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark shadow-xs transition-all active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Terapkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

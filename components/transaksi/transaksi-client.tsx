'use client';

import React, { useState, useTransition } from 'react';
import { Sale, PaymentStatus } from '@/types/warung';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/format';
import { TransaksiDetailSheet } from './transaksi-detail-sheet';
import { getSaleByIdAction, getSalesAction } from '@/app/actions/sales';
import { cn } from '@/lib/utils';
import {
  Receipt,
  TrendingUp,
  Clock,
  User,
  ShoppingBag,
  ChevronRight,
  Inbox,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface TransaksiClientProps {
  initialSales: Sale[];
  todayDate: string;
}

function formatStatus(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', variant: 'success' as const };
    case 'partial':
      return { label: 'Sebagian', variant: 'warning' as const };
    case 'unpaid':
      return { label: 'Belum Bayar', variant: 'danger' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function getYesterdayFromIsoDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  const yStr = date.getUTCFullYear();
  const mStr = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dStr = String(date.getUTCDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

function formatIndonesianDate(isoDate: string): string {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  } catch {
    return isoDate;
  }
}

export function TransaksiClient({ initialSales, todayDate }: TransaksiClientProps) {
  const yesterday = getYesterdayFromIsoDate(todayDate);

  const [mode, setMode] = useState<'today' | 'previous'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [isPending, startTransition] = useTransition();

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Switch to "Hari Ini" mode
  const handleSelectToday = () => {
    if (mode === 'today') return;
    setMode('today');
    startTransition(async () => {
      const res = await getSalesAction({
        startDate: todayDate,
        endDate: todayDate,
      });
      if (res.success && res.data) {
        setSales(res.data);
      }
    });
  };

  // Switch to "Sebelumnya" mode
  const handleSelectPrevious = () => {
    if (mode === 'previous') return;
    setMode('previous');
    const targetDate = selectedDate || yesterday;
    startTransition(async () => {
      const res = await getSalesAction({
        startDate: targetDate,
        endDate: targetDate,
      });
      if (res.success && res.data) {
        setSales(res.data);
      }
    });
  };

  // Change selected date under "Sebelumnya" mode
  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    startTransition(async () => {
      const res = await getSalesAction({
        startDate: newDate,
        endDate: newDate,
      });
      if (res.success && res.data) {
        setSales(res.data);
      }
    });
  };

  // Compute summary stats
  const totalOmzet = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransaksi = sales.length;
  const totalProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);

  const handleSelectSale = async (sale: Sale) => {
    setSelectedSale(sale);
    setIsSheetOpen(true);

    if (sale.paymentStatus === 'partial' || sale.paymentStatus === 'unpaid') {
      try {
        setIsLoadingDetail(true);
        const res = await getSaleByIdAction(sale.id);
        if (res.success && res.data) {
          setSelectedSale(res.data);
        }
      } catch (err) {
        console.error('Failed to load full sale details:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const formattedSelectedDate = formatIndonesianDate(mode === 'today' ? todayDate : selectedDate);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Date Filter Segmented Control & Selector */}
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 p-1 bg-surface-subtle border border-border rounded-xl">
          <button
            type="button"
            onClick={handleSelectToday}
            className={cn(
              'py-2 rounded-lg text-small font-semibold transition-all select-none',
              mode === 'today'
                ? 'bg-surface text-text shadow-xs border border-border/80 font-bold'
                : 'text-text-secondary hover:text-text'
            )}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={handleSelectPrevious}
            className={cn(
              'py-2 rounded-lg text-small font-semibold transition-all select-none',
              mode === 'previous'
                ? 'bg-surface text-text shadow-xs border border-border/80 font-bold'
                : 'text-text-secondary hover:text-text'
            )}
          >
            Sebelumnya
          </button>
        </div>

        {/* Previous Date Selector */}
        {mode === 'previous' && (
          <div className="p-3 rounded-xl bg-surface border border-border shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="previous-date-input" className="flex items-center gap-1.5 text-caption font-semibold text-text-secondary">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Pilih Tanggal:</span>
              </label>
              <span className="text-caption font-medium text-primary">
                {formatIndonesianDate(selectedDate)}
              </span>
            </div>
            <input
              id="previous-date-input"
              type="date"
              value={selectedDate}
              max={yesterday}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border text-body text-text font-medium focus:outline-hidden focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className={cn('grid grid-cols-2 gap-3 transition-opacity duration-200', isPending && 'opacity-60')}>
        <div className="card-warm p-4 flex flex-col gap-1 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1.5 text-caption font-medium text-text-secondary">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>{mode === 'today' ? 'Omzet Hari Ini' : 'Omzet'}</span>
          </div>
          <span className="text-h2 font-bold text-text mt-0.5">
            {formatRupiah(totalOmzet)}
          </span>
          <span className="text-caption text-text-muted">
            Estimasi laba: {formatRupiah(totalProfit)}
          </span>
        </div>

        <div className="card-warm p-4 flex flex-col gap-1 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1.5 text-caption font-medium text-text-secondary">
            <Receipt className="w-4 h-4 text-primary" />
            <span>{mode === 'today' ? 'Transaksi Hari Ini' : 'Total Transaksi'}</span>
          </div>
          <span className="text-h2 font-bold text-text mt-0.5">
            {totalTransaksi}
          </span>
          <span className="text-caption text-text-muted">
            Penjualan tercatat
          </span>
        </div>
      </div>

      {/* Transaction List Section */}
      <div className={cn('flex flex-col gap-2.5 transition-opacity duration-200', isPending && 'opacity-60')}>
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-body-medium font-semibold text-text">
            Daftar Transaksi
          </h2>
          <span className="text-caption text-text-secondary font-medium">
            {totalTransaksi} transaksi
          </span>
        </div>

        {sales.length === 0 ? (
          /* Empty State */
          <div className="card-warm rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border/80 my-4">
            <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted mb-1">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-body font-semibold text-text">
              {mode === 'today' ? 'Belum ada transaksi hari ini' : 'Tidak ada transaksi'}
            </h3>
            <p className="text-small text-text-secondary max-w-xs">
              {mode === 'today'
                ? 'Transaksi kasir yang selesai hari ini akan otomatis muncul di sini.'
                : `Tidak ada transaksi pada ${formattedSelectedDate}.`}
            </p>
          </div>
        ) : (
          /* Transaction Cards List */
          <div className="flex flex-col gap-2.5">
            {sales.map((sale) => {
              const statusInfo = formatStatus(sale.paymentStatus);
              const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={sale.id}
                  onClick={() => handleSelectSale(sale)}
                  className="card-warm p-3.5 rounded-2xl cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all flex flex-col gap-2 shadow-xs"
                >
                  {/* Row 1: Tx Number, Time & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-small font-semibold text-text truncate">
                        {sale.transactionNumber}
                      </span>
                      <div className="flex items-center gap-1 text-caption text-text-muted shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(sale.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  {/* Row 2: Customer (if any) & Items summary */}
                  <div className="flex items-center justify-between text-caption text-text-secondary pt-0.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 text-text-muted" />
                        <span>
                          {sale.items.length} produk ({itemCount} item)
                        </span>
                      </div>

                      {sale.customerName && (
                        <div className="flex items-center gap-1 truncate font-medium text-text">
                          <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          <span className="truncate">{sale.customerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Total & Remaining Receivable (if any) */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-caption text-text-secondary">Total:</span>
                      <span className="text-body-medium font-bold text-text">
                        {formatRupiah(sale.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sale.amountDue > 0 && (
                        <span className="text-caption font-semibold text-danger flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Sisa {formatRupiah(sale.amountDue)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Detail Bottom Sheet */}
      <TransaksiDetailSheet
        sale={selectedSale}
        isOpen={isSheetOpen}
        isLoading={isLoadingDetail}
        onClose={() => {
          setIsSheetOpen(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
}

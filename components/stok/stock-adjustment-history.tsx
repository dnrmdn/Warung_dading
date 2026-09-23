'use client';

import React from 'react';
import { StockAdjustmentHistoryItem } from '@/types/warung';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ArrowRight, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';

interface StockAdjustmentHistoryProps {
  initialHistory: StockAdjustmentHistoryItem[];
}

const REASON_LABELS: Record<string, string> = {
  retur_supplier: 'Retur Supplier',
  rusak_kadaluarsa: 'Rusak / Kadaluarsa',
  pemakaian_sendiri: 'Pemakaian Sendiri',
  koreksi_opname: 'Koreksi Opname',
  lainnya: 'Lainnya',
};

function getReasonLabel(reason: string): string {
  return REASON_LABELS[reason] || reason;
}

function getReasonBadgeVariant(reason: string): 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'muted' {
  switch (reason) {
    case 'koreksi_opname':
      return 'primary';
    case 'rusak_kadaluarsa':
      return 'danger';
    case 'pemakaian_sendiri':
      return 'warning';
    case 'retur_supplier':
      return 'default';
    case 'lainnya':
    default:
      return 'muted';
  }
}

/**
 * Format a Date or ISO string to Jakarta date grouping key: "YYYY-MM-DD"
 */
function getJakartaDateKey(isoString: string): string {
  try {
    const d = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    return isoString.split('T')[0] || isoString;
  }
}

/**
 * Formats a Date or ISO string into localized Indonesian header: "Rabu, 23 September 2026"
 */
function formatJakartaDateHeading(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats time in Asia/Jakarta: "10:32"
 */
function formatJakartaTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export function StockAdjustmentHistory({ initialHistory }: StockAdjustmentHistoryProps) {
  // Empty State
  if (!initialHistory || initialHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-text-muted mb-3.5">
          <ClipboardList className="w-7 h-7 stroke-[1.5]" />
        </div>
        <h3 className="text-body-medium font-bold text-text mb-1">
          Belum ada riwayat penyesuaian stok
        </h3>
        <p className="text-caption text-text-secondary max-w-[260px]">
          Penyesuaian stok yang dilakukan akan muncul di sini.
        </p>
      </div>
    );
  }

  // In-memory grouping by Jakarta calendar date
  const groups: { dateKey: string; heading: string; items: StockAdjustmentHistoryItem[] }[] = [];
  const map = new Map<string, StockAdjustmentHistoryItem[]>();

  for (const item of initialHistory) {
    const dateKey = getJakartaDateKey(item.createdAt);
    let list = map.get(dateKey);
    if (!list) {
      list = [];
      map.set(dateKey, list);
      groups.push({
        dateKey,
        heading: formatJakartaDateHeading(item.createdAt),
        items: list,
      });
    }
    list.push(item);
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-w-2xl mx-auto w-full">
      {groups.map((group) => (
        <section key={group.dateKey} className="flex flex-col gap-2">
          {/* Calendar Date Header */}
          <div className="flex items-center gap-1.5 px-1">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <h2 className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              {group.heading}
            </h2>
          </div>

          {/* Cards for this date */}
          <div className="flex flex-col gap-2">
            {group.items.map((item) => {
              const reasonLabel = getReasonLabel(item.reason);
              const reasonVariant = getReasonBadgeVariant(item.reason);
              const timeString = formatJakartaTime(item.createdAt);

              // Quantity change presentation
              const isAdd = item.type === 'add';
              const isReduce = item.type === 'reduce';
              const isSet = item.type === 'set';

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface border border-border flex flex-col gap-2.5 transition-colors hover:border-border/80"
                >
                  {/* Top line: Reason Badge & Time */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={reasonVariant}>{reasonLabel}</Badge>
                    <span className="text-caption text-text-muted font-medium">
                      {timeString}
                    </span>
                  </div>

                  {/* Middle row: Product name & Quantity badge/indicator */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-body-medium font-semibold text-text truncate">
                        {item.product.name}
                      </h3>
                      {item.note && (
                        <p className="text-caption text-text-secondary line-clamp-2 mt-0.5 italic">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Quantity delta indicator */}
                    <div className="shrink-0 text-right">
                      {isAdd && (
                        <span className="inline-flex items-center gap-0.5 text-body-medium font-bold text-success">
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          +{item.amount}
                        </span>
                      )}
                      {isReduce && (
                        <span className="inline-flex items-center gap-0.5 text-body-medium font-bold text-danger">
                          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                          -{item.amount}
                        </span>
                      )}
                      {isSet && (
                        <span className="inline-flex items-center gap-1 text-caption font-semibold px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary border border-border">
                          <RefreshCw className="w-3 h-3 stroke-[2]" />
                          Set Stok
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Before -> After Stock snapshot */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-caption text-text-secondary">
                    <span>Stok:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-text-muted">{item.previousStock}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                      <span className="font-semibold text-text">{item.newStock} {item.product.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

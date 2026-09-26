'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { DashboardHppChangeItem } from '@/types/warung';
import { formatRupiah } from '@/lib/format';
import { markHppChangeAsReadAction } from '@/app/actions/dashboard';
import { TrendingUp, TrendingDown, X, ChevronRight } from 'lucide-react';

interface HppChangeNotificationProps {
  items: DashboardHppChangeItem[];
}

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} hari lalu`;
}

function HppChangeRow({ item, onDismiss }: { item: DashboardHppChangeItem; onDismiss: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const increased = item.newHpp > item.oldHpp;
  const delta = Math.abs(item.newHpp - item.oldHpp);
  const pct = item.oldHpp > 0 ? ((delta / item.oldHpp) * 100).toFixed(1) : null;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await markHppChangeAsReadAction(item.id);
      if (result.success) {
        onDismiss(item.id);
      }
    });
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 transition-opacity ${isPending ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Icon */}
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 ${
          increased
            ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        }`}
      >
        {increased ? (
          <TrendingUp className="w-4 h-4 stroke-[2.2]" />
        ) : (
          <TrendingDown className="w-4 h-4 stroke-[2.2]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-medium font-semibold text-text block truncate">
            {item.productName}
          </span>
          <button
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Tandai sudah dibaca"
            className="flex items-center justify-center w-5 h-5 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle transition-colors shrink-0 mt-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-caption text-text-muted line-through">
            {formatRupiah(item.oldHpp)}
          </span>
          <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
          <span
            className={`text-caption font-semibold ${
              increased
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatRupiah(item.newHpp)}
          </span>
          {pct && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0 rounded-full ${
                increased
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {increased ? '+' : '-'}{pct}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-text-muted">
            {formatRelativeTime(item.createdAt)}
          </span>
          <span className="text-[10px] text-text-muted">·</span>
          <Link
            href={`/produk/${item.productId}`}
            className="text-[10px] text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Lihat produk
          </Link>
          <span className="text-[10px] text-text-muted">·</span>
          <Link
            href={`/pembelian/${item.purchaseId}`}
            className="text-[10px] text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Lihat pembelian
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HppChangeNotification({ items }: HppChangeNotificationProps) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id))
  );

  const unread = items.filter(
    (i) => visibleIds.has(i.id) && !i.readAt
  );

  if (unread.length === 0) return null;

  function handleDismiss(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-semibold text-small text-rose-600 dark:text-rose-400">
          <TrendingUp className="w-4 h-4" />
          <span>Perubahan HPP Terdeteksi</span>
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold">
            {unread.length}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="flex flex-col bg-surface rounded-2xl border border-rose-500/20 divide-y divide-border/60 overflow-hidden shadow-2xs">
        {unread.map((item) => (
          <HppChangeRow key={item.id} item={item} onDismiss={handleDismiss} />
        ))}
      </div>
    </div>
  );
}

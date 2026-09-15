'use client';

import React, { useState } from 'react';
import { ExpenseCategoryReportItem } from '@/lib/services/reports';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Receipt, PieChart } from 'lucide-react';

interface ReportExpenseChartProps {
  expenseCategories: ExpenseCategoryReportItem[];
  totalExpenses: number;
}

const CATEGORY_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  operasional: { stroke: '#D97757', bg: 'bg-primary/15', text: 'text-primary' },
  bahan_baku: { stroke: '#C58A3A', bg: 'bg-warning/15', text: 'text-warning' },
  transportasi: { stroke: '#5B8068', bg: 'bg-success/15', text: 'text-success' },
  gaji: { stroke: '#7E69AB', bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300' },
  peralatan: { stroke: '#4A7C9B', bg: 'bg-sky-100 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300' },
  lainnya: { stroke: '#706E69', bg: 'bg-stone-200 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-300' },
};

const DEFAULT_COLOR = { stroke: '#9B9892', bg: 'bg-stone-200', text: 'text-stone-700' };

export function ReportExpenseChart({
  expenseCategories,
  totalExpenses,
}: ReportExpenseChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Donut SVG parameters
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets safely using immutable reduction
  const segments = React.useMemo(() => {
    return expenseCategories.map((item, index, arr) => {
      const previousSum = arr.slice(0, index).reduce((sum, curr) => sum + curr.percentage, 0);
      const startAngle = (previousSum / 100) * 360;
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((previousSum / 100) * circumference);
      const colors = CATEGORY_COLORS[item.category] || DEFAULT_COLOR;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        startAngle,
        colors,
      };
    });
  }, [expenseCategories, circumference]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-h3 font-bold text-text">Kategori Pengeluaran</span>
          </div>
          <p className="text-caption text-text-secondary mt-0.5">
            Distribusi biaya dan pengeluaran operasional
          </p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-subtle text-danger">
          <PieChart className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {totalExpenses === 0 || expenseCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
          <Receipt className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
          <span className="text-body-medium font-bold text-text">Tidak Ada Pengeluaran</span>
          <span className="text-caption text-text-secondary mt-0.5">
            Belum ada catatan pengeluaran operasional pada periode terpilih.
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* Donut Chart Visual */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90 select-none"
            >
              {/* Background Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--surface-subtle)"
                strokeWidth={strokeWidth}
              />

              {/* Category Segments */}
              {segments.map((seg) => {
                const isHovered = hoveredCategory === seg.category;

                return (
                  <circle
                    key={seg.category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={seg.colors.stroke}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(seg.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-caption text-text-muted">Total Beban</span>
              <span className="text-body font-bold text-text">
                {formatRupiah(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Category List & Legend */}
          <div className="flex-1 w-full flex flex-col gap-2">
            {segments.map((item) => {
              const isHovered = hoveredCategory === item.category;

              return (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer',
                    isHovered
                      ? 'bg-surface-subtle border-primary/50 shadow-2xs'
                      : 'bg-surface border-border/80 hover:bg-surface-subtle/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.colors.stroke }}
                    />
                    <span className="text-small font-semibold text-text truncate">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-small font-bold text-text">
                      {formatRupiah(item.amount)}
                    </span>
                    <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-text-secondary">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

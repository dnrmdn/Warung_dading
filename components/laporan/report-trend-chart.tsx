'use client';

import React, { useState, useMemo } from 'react';
import { DailyTrendPoint } from '@/lib/services/reports';
import { formatRupiah, formatCompactRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface ReportTrendChartProps {
  trend: DailyTrendPoint[];
  periodLabel: string;
}

type ActiveMetric = 'all' | 'revenue' | 'profit' | 'expense';

export function ReportTrendChart({ trend, periodLabel }: ReportTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('all');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const hasActivity = useMemo(() => {
    return trend.some((p) => p.revenue > 0 || p.expenses > 0);
  }, [trend]);

  // Chart dimensions & scaling
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 16, bottom: 32, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Maximum scale value across all series
  const maxValue = useMemo(() => {
    let max = 0;
    for (const p of trend) {
      if (p.revenue > max) max = p.revenue;
      if (p.grossProfit > max) max = p.grossProfit;
      if (p.expenses > max) max = p.expenses;
    }
    // Round up to nice number or fallback to 100,000
    if (max === 0) return 100000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil((max * 1.15) / magnitude) * magnitude;
  }, [trend]);

  // Coordinates helper
  const getX = React.useCallback(
    (index: number) => {
      if (trend.length <= 1) return padding.left + chartWidth / 2;
      return padding.left + (index / (trend.length - 1)) * chartWidth;
    },
    [trend.length, chartWidth, padding.left]
  );

  const getY = React.useCallback(
    (val: number) => {
      const clamped = Math.max(0, val);
      return padding.top + chartHeight - (clamped / maxValue) * chartHeight;
    },
    [maxValue, chartHeight, padding.top]
  );

  // Build SVG path strings
  const revenuePoints = useMemo(() => trend.map((p, i) => `${getX(i)},${getY(p.revenue)}`), [trend, getX, getY]);
  const profitPoints = useMemo(() => trend.map((p, i) => `${getX(i)},${getY(p.grossProfit)}`), [trend, getX, getY]);
  const expensePoints = useMemo(() => trend.map((p, i) => `${getX(i)},${getY(p.expenses)}`), [trend, getX, getY]);

  const revenuePath = revenuePoints.join(' ');
  const profitPath = profitPoints.join(' ');
  const expensePath = expensePoints.join(' ');

  const revenueArea = trend.length > 0
    ? `${getX(0)},${padding.top + chartHeight} ${revenuePath} ${getX(trend.length - 1)},${padding.top + chartHeight}`
    : '';

  const profitArea = trend.length > 0
    ? `${getX(0)},${padding.top + chartHeight} ${profitPath} ${getX(trend.length - 1)},${padding.top + chartHeight}`
    : '';

  // Hover point data
  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < trend.length
    ? trend[hoverIndex]
    : null;

  // X-axis label reduction for readability on dense ranges
  const labelInterval = Math.max(1, Math.ceil(trend.length / 7));

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-2xs">
      {/* Chart Header & Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-h3 font-bold text-text">Tren Keuangan</span>
            <span className="text-caption text-text-muted">({periodLabel})</span>
          </div>
          <p className="text-caption text-text-secondary mt-0.5">
            Pergerakan omzet, laba kotor, dan biaya operasional
          </p>
        </div>

        {/* Series Filter Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border/80 text-caption self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold transition-colors',
              activeMetric === 'all' ? 'bg-surface text-text shadow-2xs' : 'text-text-secondary hover:text-text'
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('revenue')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
              activeMetric === 'revenue' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Omzet
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('profit')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
              activeMetric === 'profit' ? 'bg-success text-white shadow-2xs' : 'text-text-secondary hover:text-text'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-success inline-block" />
            Laba
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('expense')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1',
              activeMetric === 'expense' ? 'bg-danger text-white shadow-2xs' : 'text-text-secondary hover:text-text'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-danger inline-block" />
            Beban
          </button>
        </div>
      </div>

      {!hasActivity ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-surface text-text-muted border border-border mb-2.5 shadow-2xs">
            <BarChart3 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h4 className="text-body-medium font-bold text-text">Belum Ada Transaksi</h4>
          <p className="text-caption text-text-secondary max-w-xs mt-1">
            Tidak ada transaksi penjualan atau pengeluaran yang tercatat pada periode ini.
          </p>
        </div>
      ) : (
        /* Interactive SVG Chart */
        <div className="flex flex-col gap-3">
          <div className="relative w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible touch-none"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                {/* Revenue Gradient */}
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97757" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D97757" stopOpacity="0.0" />
                </linearGradient>
                {/* Profit Gradient */}
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B8068" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5B8068" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const yVal = padding.top + chartHeight * ratio;
                const labelVal = Math.round(maxValue * (1 - ratio));
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={yVal}
                      x2={width - padding.right}
                      y2={yVal}
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 6}
                      y={yVal + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-text-muted font-mono"
                    >
                      {formatCompactRupiah(labelVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              {(activeMetric === 'all' || activeMetric === 'revenue') && (
                <polygon points={revenueArea} fill="url(#revGradient)" />
              )}
              {(activeMetric === 'all' || activeMetric === 'profit') && (
                <polygon points={profitArea} fill="url(#profitGradient)" />
              )}

              {/* Polylines */}
              {(activeMetric === 'all' || activeMetric === 'revenue') && (
                <polyline
                  fill="none"
                  stroke="#D97757"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={revenuePath}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'profit') && (
                <polyline
                  fill="none"
                  stroke="#5B8068"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={profitPath}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'expense') && (
                <polyline
                  fill="none"
                  stroke="#B85C5C"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={expensePath}
                />
              )}

              {/* Interactive Hit Areas for Hover */}
              {trend.map((point, index) => {
                const x = getX(index);
                const isHovered = hoverIndex === index;

                return (
                  <g
                    key={point.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(index)}
                    onTouchStart={() => setHoverIndex(index)}
                  >
                    {/* Transparent vertical touch bar */}
                    <rect
                      x={x - chartWidth / (trend.length * 2 || 1)}
                      y={padding.top}
                      width={chartWidth / (trend.length || 1)}
                      height={chartHeight}
                      fill="transparent"
                    />

                    {/* Active vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + chartHeight}
                        stroke="#706E69"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Data Points on Hover */}
                    {isHovered && (
                      <>
                        {(activeMetric === 'all' || activeMetric === 'revenue') && (
                          <circle
                            cx={x}
                            cy={getY(point.revenue)}
                            r="4.5"
                            fill="#D97757"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        )}
                        {(activeMetric === 'all' || activeMetric === 'profit') && (
                          <circle
                            cx={x}
                            cy={getY(point.grossProfit)}
                            r="4.5"
                            fill="#5B8068"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        )}
                        {(activeMetric === 'all' || activeMetric === 'expense') && point.expenses > 0 && (
                          <circle
                            cx={x}
                            cy={getY(point.expenses)}
                            r="4"
                            fill="#B85C5C"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        )}
                      </>
                    )}

                    {/* X-axis date labels */}
                    {index % labelInterval === 0 && (
                      <text
                        x={x}
                        y={height - 8}
                        textAnchor="middle"
                        className={cn(
                          'text-[10px] font-medium transition-colors',
                          isHovered ? 'fill-text font-bold' : 'fill-text-secondary'
                        )}
                      >
                        {point.displayDate}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Hover Details Card */}
          {activePoint ? (
            <div className="p-3 rounded-xl bg-surface-subtle border border-border flex flex-wrap items-center justify-between gap-3 text-caption animate-in fade-in duration-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text">{activePoint.dayName}, {activePoint.displayDate}</span>
                <span className="text-text-muted">• {activePoint.transactions} nota</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span className="text-text-secondary">Omzet:</span>
                  <strong className="text-text">{formatRupiah(activePoint.revenue)}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                  <span className="text-text-secondary">Laba:</span>
                  <strong className="text-success">{formatRupiah(activePoint.grossProfit)}</strong>
                </div>
                {activePoint.expenses > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" />
                    <span className="text-text-secondary">Biaya:</span>
                    <strong className="text-danger">{formatRupiah(activePoint.expenses)}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-caption text-text-secondary pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-primary" />
                <span>Omzet Penjualan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-success" />
                <span>Laba Kotor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-danger border-b border-dashed border-danger" />
                <span>Beban Pengeluaran</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

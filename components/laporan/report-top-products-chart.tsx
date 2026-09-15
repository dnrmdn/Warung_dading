import React from 'react';
import { TopProductReportItem } from '@/lib/services/reports';
import { formatRupiah } from '@/lib/format';
import { ProductIcon } from '@/components/ui/product-icon';
import { Package, Award } from 'lucide-react';

interface ReportTopProductsChartProps {
  topProducts: TopProductReportItem[];
}

export function ReportTopProductsChart({ topProducts }: ReportTopProductsChartProps) {
  const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.revenue)) : 1;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-h3 font-bold text-text">Produk Terlaris</span>
          </div>
          <p className="text-caption text-text-secondary mt-0.5">
            Kontribusi omzet produk pada periode terpilih
          </p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-subtle text-primary">
          <Award className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      {topProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-7 px-4 rounded-xl bg-surface-subtle border border-dashed border-border text-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-surface text-text-muted border border-border/80 mb-2.5 shadow-2xs">
            <Package className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-body-medium font-bold text-text">Belum Ada Penjualan</span>
          <p className="text-caption text-text-secondary max-w-xs mt-1 leading-relaxed">
            Belum ada transaksi penjualan pada periode yang dipilih. Produk terlaris akan muncul setelah ada transaksi.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topProducts.map((item) => {
            const barWidthPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));

            return (
              <div
                key={item.productId}
                className="p-3 rounded-xl bg-surface-subtle/70 border border-border/80 flex flex-col gap-2 transition-all hover:bg-surface-subtle"
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface text-primary border border-border/60 shrink-0">
                      <ProductIcon name={item.iconName} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-body-medium font-bold text-text block truncate leading-tight">
                        {item.name}
                      </span>
                      <span className="text-caption text-text-muted block">
                        {item.quantity} unit terjual • Laba {formatRupiah(item.grossProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-body-medium font-bold text-primary-dark block leading-tight">
                      {formatRupiah(item.revenue)}
                    </span>
                    <span className="text-caption text-text-muted font-mono">
                      {item.percentageOfRevenue}% omzet
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-surface border border-border/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

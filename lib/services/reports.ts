import 'server-only';

import { prisma } from '@/lib/prisma';
import { ExpenseCategory } from '@/types/warung';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ReportPeriod = 'today' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface ReportFilter {
  period?: ReportPeriod;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
}

export interface PaymentStatusBreakdown {
  paid: { count: number; total: number };
  partial: { count: number; total: number; amountDue: number };
  unpaid: { count: number; total: number; amountDue: number };
}

export interface ReportSummary {
  totalRevenue: number;         // Omzet — SUM(totalAmount) for sales in period
  totalHpp: number;             // Modal Pokok / HPP
  grossProfit: number;          // Laba Kotor (Omzet - HPP)
  totalExpenses: number;        // Total Pengeluaran
  netProfit: number;            // Laba Bersih (Laba Kotor - Pengeluaran)
  totalPurchases: number;       // Belanja Stok (Cash Outflow pengadaan barang)
  totalTransactions: number;    // Jumlah Transaksi Penjualan
  totalItemsSold: number;       // Jumlah Total Unit Barang Terjual
  avgTransactionValue: number;  // Rata-rata Nilai Transaksi (Omzet / Transaksi)
  grossMarginPercent: number;   // Margin Laba Kotor (%)
  netMarginPercent: number;     // Margin Laba Bersih (%)

  // ─── Receivable & Cash Collection Metrics ───────────────────────────────
  // All receivable/cash metrics use IMMUTABLE initial snapshot fields so that
  // later settlements do not retroactively alter historical period reports.
  //
  // totalInitialAmountPaid     = SUM(initialAmountPaid) for sales in transaction period
  //                              = Kas POS collected at sale creation — HISTORICAL
  // totalInitialAmountDue      = SUM(initialAmountDue) for sales in transaction period
  //                              = Piutang Terbentuk — HISTORICAL, never changes after settlement
  // totalSettlementCollected   = SUM(ReceivablePayment.amount) where paidAt is in report period
  //                              = Cash collected via later settlement events — SEPARATE event date
  // periodCashInflow           = totalInitialAmountPaid + totalSettlementCollected
  //                              (no double counting: each cash event counted exactly once)
  // paymentStatusBreakdown     = derived from initialAmountPaid/initialAmountDue — HISTORICAL status
  totalInitialAmountPaid: number;      // Kas POS: SUM(initialAmountPaid) for period sales
  totalInitialAmountDue: number;       // Piutang Terbentuk: SUM(initialAmountDue) for period sales
  totalSettlementCollected: number;    // Cash collected via ReceivablePayment.paidAt in period
  periodCashInflow: number;            // totalInitialAmountPaid + totalSettlementCollected
  paymentStatusBreakdown: PaymentStatusBreakdown;
}

export interface DailyTrendPoint {
  date: string;         // 'YYYY-MM-DD'
  displayDate: string;  // e.g. '14 Sep' or 'Sen, 14'
  dayName: string;      // e.g. 'Senin'
  revenue: number;
  hpp: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  transactions: number;
}

export interface TopProductReportItem {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  grossProfit: number;
  iconName?: string;
  percentageOfRevenue: number;
}

export interface ExpenseCategoryReportItem {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
}

export interface ResolvedDateRange {
  period: ReportPeriod;
  startDateStr: string;
  endDateStr: string;
  startDateUtc: Date;
  endDateUtc: Date;
  periodLabel: string;
}

export interface ReportData {
  summary: ReportSummary;
  trend: DailyTrendPoint[];
  topProducts: TopProductReportItem[];
  expenseCategories: ExpenseCategoryReportItem[];
  dateRange: ResolvedDateRange;
}

// ─── Category Labels & Translations ──────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  operasional: 'Operasional',
  bahan_baku: 'Bahan Baku',
  transportasi: 'Transportasi',
  gaji: 'Gaji / Upah',
  peralatan: 'Peralatan & Perlengkapan',
  lainnya: 'Lain-lain',
};

// ─── Date Utility Helpers ────────────────────────────────────────────────────

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateToUtcMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function formatDateToIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): { displayDate: string; dayName: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);

  const displayDate = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });

  const dayName = dateObj.toLocaleDateString('id-ID', {
    weekday: 'short',
  });

  return { displayDate, dayName };
}

function getDaysArray(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);

  const current = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

// ─── Period Resolver ─────────────────────────────────────────────────────────

export function resolvePeriodDateRange(filter?: ReportFilter): ResolvedDateRange {
  const period: ReportPeriod = filter?.period || 'thisMonth';
  const todayStr = getTodayLocalDate();
  const now = new Date();

  let startDateStr = todayStr;
  let endDateStr = todayStr;
  let periodLabel = 'Bulan Ini';

  switch (period) {
    case 'today': {
      startDateStr = todayStr;
      endDateStr = todayStr;
      periodLabel = 'Hari Ini (' + now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ')';
      break;
    }
    case 'last7days': {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      const sy = past7.getFullYear();
      const sm = String(past7.getMonth() + 1).padStart(2, '0');
      const sd = String(past7.getDate()).padStart(2, '0');
      startDateStr = `${sy}-${sm}-${sd}`;
      endDateStr = todayStr;
      periodLabel = '7 Hari Terakhir';
      break;
    }
    case 'thisMonth': {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      startDateStr = `${year}-${month}-01`;
      endDateStr = todayStr;
      periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      break;
    }
    case 'lastMonth': {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const sy = firstDayPrevMonth.getFullYear();
      const sm = String(firstDayPrevMonth.getMonth() + 1).padStart(2, '0');
      const sd = String(firstDayPrevMonth.getDate()).padStart(2, '0');

      const ey = lastDayPrevMonth.getFullYear();
      const em = String(lastDayPrevMonth.getMonth() + 1).padStart(2, '0');
      const ed = String(lastDayPrevMonth.getDate()).padStart(2, '0');

      startDateStr = `${sy}-${sm}-${sd}`;
      endDateStr = `${ey}-${em}-${ed}`;
      periodLabel = firstDayPrevMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      break;
    }
    case 'custom': {
      if (filter?.startDate && /^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
        startDateStr = filter.startDate;
      } else {
        startDateStr = todayStr;
      }

      if (filter?.endDate && /^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
        endDateStr = filter.endDate;
      } else {
        endDateStr = todayStr;
      }

      if (startDateStr > endDateStr) {
        const temp = startDateStr;
        startDateStr = endDateStr;
        endDateStr = temp;
      }

      periodLabel = `${startDateStr} s/d ${endDateStr}`;
      break;
    }
  }

  const startDateUtc = parseDateToUtcMidnight(startDateStr);
  const endDateUtc = parseDateToUtcMidnight(endDateStr);

  return {
    period,
    startDateStr,
    endDateStr,
    startDateUtc,
    endDateUtc,
    periodLabel,
  };
}

// ─── Consolidated Report Fetcher ─────────────────────────────────────────────

/**
 * Retrieves full report data within the specified period.
 * 100% authoritative and database-backed via PostgreSQL.
 */
export async function getReportData(filter?: ReportFilter): Promise<ReportData> {
  const dateRange = resolvePeriodDateRange(filter);
  const { startDateUtc, endDateUtc, startDateStr, endDateStr } = dateRange;

  // 1. Parallel Aggregations: Sales, Expenses, Purchases, Item count
  const [
    salesAggregate,
    itemsAggregate,
    expensesAggregate,
    purchasesAggregate,
    salesByDate,
    expensesByDate,
    topSaleItems,
    expensesByCategory,
    settlementAggregate,
    periodSalesForStatus,
  ] = await Promise.all([
    // Sales Totals (including immutable initial snapshot fields for historical reporting)
    prisma.sale.aggregate({
      where: {
        transactionDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        totalAmount: true,
        totalHpp: true,
        grossProfit: true,
        amountPaid: true,
        amountDue: true,
        initialAmountPaid: true,    // Immutable: Kas POS at sale creation
        initialAmountDue: true,     // Immutable: Piutang Terbentuk at sale creation
      },
      _count: {
        id: true,
      },
    }),

    // Total physical items sold
    prisma.saleItem.aggregate({
      where: {
        sale: {
          transactionDate: {
            gte: startDateUtc,
            lte: endDateUtc,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    }),

    // Expenses Total
    prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Purchases Total (Belanja Stok)
    prisma.purchase.aggregate({
      where: {
        purchaseDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Daily Sales Timeline Grouping
    prisma.sale.groupBy({
      by: ['transactionDate'],
      where: {
        transactionDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        totalAmount: true,
        totalHpp: true,
        grossProfit: true,
      },
      _count: {
        id: true,
      },
    }),

    // Daily Expense Timeline Grouping
    prisma.expense.groupBy({
      by: ['expenseDate'],
      where: {
        expenseDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Top Selling Products Grouping
    prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          transactionDate: {
            gte: startDateUtc,
            lte: endDateUtc,
          },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
        hppTotal: true,
      },
      orderBy: [
        { _sum: { subtotal: 'desc' } },
        { _sum: { quantity: 'desc' } },
      ],
      take: 6,
    }),

    // Expenses Grouped by Category
    prisma.expense.groupBy({
      by: ['category'],
      where: {
        expenseDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    }),

    // ReceivablePayment settlements collected during this period (by paidAt)
    prisma.receivablePayment.aggregate({
      where: {
        paidAt: {
          gte: startDateUtc,
          lte: new Date(endDateUtc.getTime() + 24 * 60 * 60 * 1000 - 1),
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Historical payment status for sales in period — uses immutable initial snapshot,
    // not mutable paymentStatus, so later settlements do not alter the historical breakdown.
    prisma.sale.findMany({
      where: {
        transactionDate: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
      select: {
        totalAmount: true,
        initialAmountPaid: true,    // Immutable: used to derive historical payment status
        initialAmountDue: true,     // Immutable: historical receivable and status derivation
      },
    }),
  ]);

  // 2. Compute Summary Financials
  const totalRevenue = salesAggregate._sum.totalAmount ?? 0;
  const totalHpp = salesAggregate._sum.totalHpp ?? 0;
  const grossProfit = salesAggregate._sum.grossProfit ?? (totalRevenue - totalHpp);
  const totalExpenses = expensesAggregate._sum.amount ?? 0;
  const netProfit = grossProfit - totalExpenses;
  const totalPurchases = purchasesAggregate._sum.totalAmount ?? 0;
  const totalTransactions = salesAggregate._count.id;
  const totalItemsSold = itemsAggregate._sum.quantity ?? 0;
  const avgTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // 2b. Compute Receivable & Cash Collection Metrics
  // All values derived from immutable initial snapshot fields so historical
  // reports remain stable after later receivable settlements.
  const totalInitialAmountPaid = salesAggregate._sum.initialAmountPaid ?? 0;     // Kas POS at sale creation
  const totalInitialAmountDue  = salesAggregate._sum.initialAmountDue  ?? 0;     // Piutang Terbentuk at sale creation
  const totalSettlementCollected = settlementAggregate._sum.amount ?? 0;         // Cash via ReceivablePayment.paidAt
  const periodCashInflow = totalInitialAmountPaid + totalSettlementCollected;    // No double counting

  // 2c. Build Payment Status Breakdown
  // Status is DERIVED from the immutable initial snapshot (initialAmountPaid / initialAmountDue),
  // NOT from the mutable Sale.paymentStatus field. This preserves the historical status
  // even after later settlements flip paymentStatus to 'paid'.
  const paymentStatusBreakdown: PaymentStatusBreakdown = {
    paid: { count: 0, total: 0 },
    partial: { count: 0, total: 0, amountDue: 0 },
    unpaid: { count: 0, total: 0, amountDue: 0 },
  };

  for (const sale of periodSalesForStatus) {
    // Derive historical status from immutable amounts — mirrors PaymentStatus logic in createSale
    const historicalStatus: 'paid' | 'partial' | 'unpaid' =
      sale.initialAmountDue === 0 ? 'paid'
      : sale.initialAmountPaid > 0 ? 'partial'
      : 'unpaid';

    if (historicalStatus === 'paid') {
      paymentStatusBreakdown.paid.count += 1;
      paymentStatusBreakdown.paid.total += sale.totalAmount;
    } else if (historicalStatus === 'partial') {
      paymentStatusBreakdown.partial.count += 1;
      paymentStatusBreakdown.partial.total += sale.totalAmount;
      paymentStatusBreakdown.partial.amountDue += sale.initialAmountDue;  // Historical receivable at creation
    } else {
      paymentStatusBreakdown.unpaid.count += 1;
      paymentStatusBreakdown.unpaid.total += sale.totalAmount;
      paymentStatusBreakdown.unpaid.amountDue += sale.initialAmountDue;   // Historical receivable at creation
    }
  }

  const summary: ReportSummary = {
    totalRevenue,
    totalHpp,
    grossProfit,
    totalExpenses,
    netProfit,
    totalPurchases,
    totalTransactions,
    totalItemsSold,
    avgTransactionValue,
    grossMarginPercent,
    netMarginPercent,
    totalInitialAmountPaid,
    totalInitialAmountDue,
    totalSettlementCollected,
    periodCashInflow,
    paymentStatusBreakdown,
  };

  // 3. Build Complete Daily Timeline
  const salesMap = new Map<string, { revenue: number; hpp: number; grossProfit: number; transactions: number }>();
  for (const item of salesByDate) {
    const dStr = formatDateToIsoDate(item.transactionDate);
    salesMap.set(dStr, {
      revenue: item._sum.totalAmount ?? 0,
      hpp: item._sum.totalHpp ?? 0,
      grossProfit: item._sum.grossProfit ?? 0,
      transactions: item._count.id,
    });
  }

  const expensesMap = new Map<string, number>();
  for (const item of expensesByDate) {
    const dStr = formatDateToIsoDate(item.expenseDate);
    expensesMap.set(dStr, item._sum.amount ?? 0);
  }

  const allDays = getDaysArray(startDateStr, endDateStr);
  const trend: DailyTrendPoint[] = allDays.map((dStr) => {
    const saleData = salesMap.get(dStr);
    const rev = saleData?.revenue ?? 0;
    const hpp = saleData?.hpp ?? 0;
    const gross = saleData?.grossProfit ?? (rev - hpp);
    const exp = expensesMap.get(dStr) ?? 0;
    const net = gross - exp;
    const tx = saleData?.transactions ?? 0;

    const { displayDate, dayName } = formatDisplayDate(dStr);

    return {
      date: dStr,
      displayDate,
      dayName,
      revenue: rev,
      hpp,
      grossProfit: gross,
      expenses: exp,
      netProfit: net,
      transactions: tx,
    };
  });

  // 4. Resolve Top Products with Historical Snapshot Name
  let topProducts: TopProductReportItem[] = [];
  if (topSaleItems.length > 0) {
    const productIds = topSaleItems.map((item) => item.productId);

    // Both sub-queries need productIds from Wave 1 but are independent of each other.
    const [recentSaleItems, catalogProducts] = await Promise.all([
      // Retrieve historical snapshot names
      prisma.saleItem.findMany({
        where: {
          productId: { in: productIds },
          sale: {
            transactionDate: {
              gte: startDateUtc,
              lte: endDateUtc,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['productId'],
        select: {
          productId: true,
          productName: true,
        },
      }),

      // Retrieve active icon name from catalog
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, iconName: true },
      }),
    ]);

    const snapshotNameMap = new Map(recentSaleItems.map((s) => [s.productId, s.productName]));
    const catalogMap = new Map(catalogProducts.map((p) => [p.id, p.iconName]));

    topProducts = topSaleItems.map((item) => {
      const name = snapshotNameMap.get(item.productId) ?? 'Produk';
      const iconName = catalogMap.get(item.productId) ?? undefined;
      const rev = item._sum.subtotal ?? 0;
      const hpp = item._sum.hppTotal ?? 0;
      const quantity = item._sum.quantity ?? 0;
      const percentageOfRevenue = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;

      return {
        productId: item.productId,
        name,
        quantity,
        revenue: rev,
        grossProfit: rev - hpp,
        iconName: iconName ?? undefined,
        percentageOfRevenue,
      };
    });
  }

  // 5. Build Expense Categories Breakdown
  const expenseCategories: ExpenseCategoryReportItem[] = expensesByCategory.map((item) => {
    const category = item.category as ExpenseCategory;
    const amount = item._sum.amount ?? 0;
    const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;

    return {
      category,
      label: EXPENSE_CATEGORY_LABELS[category] || category,
      amount,
      percentage,
    };
  });

  return {
    summary,
    trend,
    topProducts,
    expenseCategories,
    dateRange,
  };
}

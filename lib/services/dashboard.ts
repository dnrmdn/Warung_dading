import 'server-only';

import { prisma } from '@/lib/prisma';
import { DashboardHppChangeItem } from '@/types/warung';

// ─── Return Types ────────────────────────────────────────────────────────────

export interface DashboardTopProduct {
  id: string;             // productId
  name: string;           // Historical snapshot from latest SaleItem
  price?: number;         // Current catalog price (if available)
  iconName?: string;      // Current catalog icon (if available)
  totalSold: number;      // Total quantity sold all-time
  totalRevenue: number;   // Total subtotal revenue generated all-time
}

export interface DashboardLowStockItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  iconName?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  todayTransactions: number;
  // Immutable initial snapshot fields — represent the payment state at Sale creation today.
  // These do NOT change when later settlements are recorded against today's sales.
  todayInitialAmountPaid: number;  // Kas POS Hari Ini: SUM(initialAmountPaid) for today's sales
  todayInitialAmountDue: number;   // Piutang Terbentuk Hari Ini: SUM(initialAmountDue) for today's sales
  // Live operational receivable — intentionally mutable, reflects current outstanding balance
  totalReceivableDue: number;      // Global store current outstanding receivable (SUM amountDue > 0)
  unpaidCustomerCount: number;     // Distinct customers with current outstanding receivables
  topProducts: DashboardTopProduct[];
  lowStockProducts: DashboardLowStockItem[];
  totalProductCount: number;
  recentHppChanges: DashboardHppChangeItem[];
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

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

// ─── Dashboard Query Service ─────────────────────────────────────────────────

/**
 * Retrieves consolidated dashboard summary metrics in a single coordinated read.
 * @param dateOverride Optional YYYY-MM-DD for deterministic testing or specific calendar day inspection.
 */
export async function getDashboardStats(dateOverride?: string): Promise<DashboardStats> {
  const targetDateStr = dateOverride ?? getTodayLocalDate();
  const targetDate = parseDateToUtcMidnight(targetDateStr);

  // 1. Query all data in a single parallel wave — no second round trip needed.
  //    - today's sales metrics
  //    - global outstanding receivables
  //    - distinct unpaid customers
  //    - all-time top 4 products (no dependency on sales metrics)
  //    - active product list for low-stock warnings, catalog count, and catalog attributes
  //    - latest snapshot names per product (for top-product display names)
  const [
    todayAggregate,
    globalReceivableAggregate,
    outstandingCustomersGroup,
    topGrouped,
    activeProducts,
    allRecentSnapshots,
    rawHppChanges,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        transactionDate: targetDate,
      },
      _sum: {
        totalAmount: true,
        grossProfit: true,
        initialAmountPaid: true,   // Immutable: Kas POS at sale creation
        initialAmountDue: true,    // Immutable: Piutang Terbentuk at sale creation
      },
      _count: {
        id: true,
      },
    }),

    // Global store outstanding receivables sum
    prisma.sale.aggregate({
      where: {
        amountDue: { gt: 0 },
        customerName: { not: null },
      },
      _sum: {
        amountDue: true,
      },
    }),

    // Distinct customers with outstanding receivables
    prisma.sale.groupBy({
      by: ['customerName'],
      where: {
        amountDue: { gt: 0 },
        customerName: { not: null },
      },
    }),

    // All-time top 4 products by quantity sold — independent of today's metrics
    prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: [
        { _sum: { quantity: 'desc' } },
        { _sum: { subtotal: 'desc' } },
      ],
      take: 4,
    }),

    // Active products for catalog count and low-stock warnings — independent of all above
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        unit: true,
        iconName: true,
        price: true,
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' },
      ],
    }),

    // Latest historical SaleItem.productName snapshot per product — unfiltered
    // by productId so it runs in Wave 1 (before topGrouped results are known).
    // Returns a superset; only entries matching top product IDs are consumed.
    prisma.saleItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['productId'],
      select: {
        productId: true,
        productName: true,
      },
    }),

    // Recent HPP changes for dashboard notification banner (bounded to 10 latest entries)
    prisma.hppChangeLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
    }),
  ]);

  const todayRevenue = todayAggregate._sum.totalAmount ?? 0;
  const todayProfit = todayAggregate._sum.grossProfit ?? 0;
  const todayTransactions = todayAggregate._count.id;
  // Use immutable initial snapshot fields — stable regardless of later settlements on today's sales
  const todayInitialAmountPaid = todayAggregate._sum.initialAmountPaid ?? 0;
  const todayInitialAmountDue  = todayAggregate._sum.initialAmountDue  ?? 0;

  const totalReceivableDue = globalReceivableAggregate._sum.amountDue ?? 0;
  // Normalize and count distinct customer names (case-insensitive/trimmed)
  const distinctCustomerSet = new Set(
    outstandingCustomersGroup
      .map((g) => (g.customerName ? g.customerName.trim().toLowerCase() : ''))
      .filter(Boolean)
  );
  const unpaidCustomerCount = distinctCustomerSet.size;

  // activeProducts is already resolved from Wave 1 above
  const totalProductCount = activeProducts.length;

  // 2. Resolve top-product names and catalog attributes from Wave 1 data.
  //    All required data was pre-fetched in the single parallel wave above:
  //    - Snapshot names: from allRecentSnapshots (unfiltered by productId)
  //    - Catalog attributes: from activeProducts (which includes price)
  //    No additional database round trip required.
  let topProducts: DashboardTopProduct[] = [];

  if (topGrouped.length > 0) {
    const snapshotNameMap = new Map(allRecentSnapshots.map((s) => [s.productId, s.productName]));
    const catalogMap = new Map(activeProducts.map((p) => [p.id, { price: p.price, iconName: p.iconName }]));

    topProducts = topGrouped.map((item) => {
      const snapshotName = snapshotNameMap.get(item.productId) ?? 'Produk';
      const catalog = catalogMap.get(item.productId);

      return {
        id: item.productId,
        name: snapshotName,
        price: catalog?.price ?? undefined,
        iconName: catalog?.iconName ?? undefined,
        totalSold: item._sum.quantity ?? 0,
        totalRevenue: item._sum.subtotal ?? 0,
      };
    });
  }

  const lowStockProducts: DashboardLowStockItem[] = activeProducts
    .filter((p) => p.stock <= p.minStock)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      iconName: p.iconName ?? undefined,
    }));

  const recentHppChanges: DashboardHppChangeItem[] = rawHppChanges.map((log) => ({
    id: log.id,
    productId: log.productId,
    productName: log.product.name,
    unit: log.product.unit,
    purchaseId: log.purchaseId,
    oldHpp: log.oldHpp,
    newHpp: log.newHpp,
    readAt: log.readAt ? log.readAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    todayRevenue,
    todayProfit,
    todayTransactions,
    todayInitialAmountPaid,
    todayInitialAmountDue,
    totalReceivableDue,
    unpaidCustomerCount,
    topProducts,
    lowStockProducts,
    totalProductCount,
    recentHppChanges,
  };
}

/**
 * Marks an HppChangeLog entry as read by recording the current timestamp in readAt.
 */
export async function markHppChangeAsRead(id: string): Promise<void> {
  const existing = await prisma.hppChangeLog.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Catatan perubahan HPP tidak ditemukan.');
  }

  await prisma.hppChangeLog.update({
    where: { id },
    data: {
      readAt: new Date(),
    },
  });
}

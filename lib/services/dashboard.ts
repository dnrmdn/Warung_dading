import 'server-only';

import { prisma } from '@/lib/prisma';

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

  // 1. Query today's sales metrics & global outstanding receivables in parallel
  const [todayAggregate, globalReceivableAggregate, outstandingCustomersGroup] = await Promise.all([
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

  // 2. Query all-time top 4 products by total sold quantity DESC, then subtotal revenue DESC
  const topGrouped = await prisma.saleItem.groupBy({
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
  });

  let topProducts: DashboardTopProduct[] = [];

  if (topGrouped.length > 0) {
    const topProductIds = topGrouped.map((item) => item.productId);

    // 3a. Retrieve the latest historical SaleItem.productName snapshot for each top product
    const recentSaleItems = await prisma.saleItem.findMany({
      where: {
        productId: { in: topProductIds },
      },
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['productId'],
      select: {
        productId: true,
        productName: true,
      },
    });
    const snapshotNameMap = new Map(recentSaleItems.map((s) => [s.productId, s.productName]));

    // 3b. Retrieve optional catalog attributes (price, iconName) from Product master
    const catalogProducts = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
      },
      select: {
        id: true,
        price: true,
        iconName: true,
      },
    });
    const catalogMap = new Map(catalogProducts.map((p) => [p.id, p]));

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

  // 4. Query active products to evaluate catalog count and low-stock warnings (stock <= minStock, top 3)
  const activeProducts = await prisma.product.findMany({
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
    },
    orderBy: [
      { stock: 'asc' },
      { name: 'asc' },
    ],
  });

  const totalProductCount = activeProducts.length;

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
  };
}

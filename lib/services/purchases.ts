import 'server-only';

import { prisma } from '@/lib/prisma';
import { Purchase, PurchaseItem } from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PurchaseValidationError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  purchaseDate?: string; // Optional 'YYYY-MM-DD', defaults to local business date
  supplierId?: string | null; // FK → Supplier; server derives supplierName
  note?: string;
  items: CreatePurchaseItemInput[];
}

export interface GetPurchasesFilter {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  limit?: number;
}

// ─── Type Converters / Mappers ───────────────────────────────────────────────

type PrismaPurchaseWithItems = Prisma.PurchaseGetPayload<{
  include: {
    items: true;
  };
}>;

function toDomainPurchaseItem(item: Prisma.PurchaseItemGetPayload<{}>): PurchaseItem {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    unitCost: item.unitCost,
    subtotal: item.subtotal,
  };
}

function toDomainPurchase(p: PrismaPurchaseWithItems): Purchase {
  return {
    id: p.id,
    purchaseDate: formatDateToIsoDate(p.purchaseDate),
    supplierId: p.supplierId ?? undefined,
    supplierName: p.supplierName ?? undefined,
    items: p.items.map(toDomainPurchaseItem),
    totalAmount: p.totalAmount,
    note: p.note ?? undefined,
    createdAt: p.createdAt.toISOString(),
  };
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

function formatDateToIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Stock Log Note Formatter ────────────────────────────────────────────────

function formatPurchaseStockNote(
  purchaseId: string,
  note?: string,
  supplierName?: string
): string {
  if (note?.trim()) {
    return `Pembelian #${purchaseId}: ${note.trim()}`;
  }
  if (supplierName?.trim()) {
    return `Pembelian #${purchaseId} (${supplierName.trim()})`;
  }
  return `Pembelian #${purchaseId}`;
}

// ─── Query Operations ────────────────────────────────────────────────────────

/**
 * Retrieves all purchases, optionally filtered by date range and limit.
 * Sorted newest-first by purchaseDate descending, then createdAt descending.
 */
export async function getPurchases(filter?: GetPurchasesFilter): Promise<Purchase[]> {
  const where: Prisma.PurchaseWhereInput = {};

  if (filter?.startDate || filter?.endDate) {
    where.purchaseDate = {};
    if (filter.startDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
        throw new PurchaseValidationError('Format startDate harus YYYY-MM-DD');
      }
      where.purchaseDate.gte = parseDateToUtcMidnight(filter.startDate);
    }
    if (filter.endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
        throw new PurchaseValidationError('Format endDate harus YYYY-MM-DD');
      }
      where.purchaseDate.lte = parseDateToUtcMidnight(filter.endDate);
    }
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: [
      { purchaseDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filter?.limit,
  });

  return purchases.map(toDomainPurchase);
}

/**
 * Retrieves a single purchase by ID.
 */
export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  return purchase ? toDomainPurchase(purchase) : null;
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

/**
 * Creates a new purchase note with atomic stock increment, frozen product snapshots,
 * and StockAdjustmentLog records inside a single PostgreSQL interactive transaction.
 */
export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  // 1. Pre-transaction input validation
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new PurchaseValidationError('Daftar barang pembelian minimal harus berisi 1 item.');
  }

  const productIds = input.items.map((it) => it.productId);
  if (new Set(productIds).size !== productIds.length) {
    throw new PurchaseValidationError('Terdapat duplikasi produk dalam satu transaksi pembelian.');
  }

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.productId || typeof item.productId !== 'string') {
      throw new PurchaseValidationError(`Item baris ke-${i + 1} tidak memiliki productId yang valid.`);
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new PurchaseValidationError(
        `Jumlah kuantitas pada baris ke-${i + 1} harus berupa bilangan bulat positif.`
      );
    }
    if (typeof item.unitCost !== 'number' || !Number.isFinite(item.unitCost) || !Number.isInteger(item.unitCost) || item.unitCost < 0) {
      throw new PurchaseValidationError(
        `Harga beli satuan pada baris ke-${i + 1} harus berupa bilangan bulat non-negatif yang valid.`
      );
    }
  }

  const purchaseDateStr = input.purchaseDate?.trim() || getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDateStr)) {
    throw new PurchaseValidationError('Format purchaseDate harus YYYY-MM-DD.');
  }

  const parsedPurchaseDate = parseDateToUtcMidnight(purchaseDateStr);

  // 2. Interactive Prisma Transaction
  return await prisma.$transaction(
    async (tx) => {
      // Step 2.1: Resolve supplier (server-side — never trust client supplierName)
      let resolvedSupplierId: string | null = null;
      let resolvedSupplierName: string | null = null;

      if (input.supplierId) {
        const supplier = await tx.supplier.findUnique({
          where: { id: input.supplierId },
          select: { id: true, name: true, isActive: true },
        });
        if (!supplier) {
          throw new PurchaseValidationError(
            `Supplier dengan ID "${input.supplierId}" tidak ditemukan.`
          );
        }
        if (!supplier.isActive) {
          throw new PurchaseValidationError(
            `Supplier "${supplier.name}" sudah tidak aktif.`
          );
        }
        resolvedSupplierId = supplier.id;
        resolvedSupplierName = supplier.name;
      }

      // Step 2.2: Fetch active products for all item productIds
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          unit: true,
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Step 2.3: Validate all requested products exist and are active
      for (const item of input.items) {
        if (!productMap.has(item.productId)) {
          throw new ProductNotFoundError(
            `Produk dengan ID "${item.productId}" tidak ditemukan atau sudah tidak aktif.`
          );
        }
      }

      // Step 2.4: Build immutable PurchaseItem snapshots and calculate totals
      let totalAmount = 0;
      const purchaseItemsData: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
        unitCost: number;
        subtotal: number;
      }> = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId)!;
        const subtotal = item.quantity * item.unitCost;
        totalAmount += subtotal;

        purchaseItemsData.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unit: product.unit,
          unitCost: item.unitCost,
          subtotal,
        });
      }

      // Step 2.5: Create Purchase + PurchaseItem records
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseDate: parsedPurchaseDate,
          supplierId: resolvedSupplierId,
          supplierName: resolvedSupplierName,
          note: input.note?.trim() || null,
          totalAmount,
          items: {
            create: purchaseItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Step 2.5: Deterministic product ID sorting before stock mutation
      const sortedProductIds = Array.from(productIds).sort((a, b) => a.localeCompare(b));
      const itemMap = new Map(input.items.map((it) => [it.productId, it.quantity]));

      // Step 2.6: Atomic stock increment + StockAdjustmentLog for each product
      for (const productId of sortedProductIds) {
        const quantity = itemMap.get(productId)!;

        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: quantity,
            },
          },
        });

        // Read updated live stock within the same transaction
        const updated = await tx.product.findUniqueOrThrow({
          where: { id: productId },
          select: { stock: true },
        });

        const newStock = updated.stock;
        const previousStock = newStock - quantity;

        const stockNote = formatPurchaseStockNote(
          createdPurchase.id,
          input.note,
          resolvedSupplierName ?? undefined
        );

        await tx.stockAdjustmentLog.create({
          data: {
            productId,
            type: 'add',
            amount: quantity,
            previousStock,
            newStock,
            reason: 'pembelian',
            note: stockNote,
          },
        });
      }

      return toDomainPurchase(createdPurchase);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 15000,
    }
  );
}

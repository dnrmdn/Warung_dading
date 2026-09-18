import 'server-only';

import { prisma } from '@/lib/prisma';
import { calculateHPP } from '@/lib/hpp';
import {
  Sale,
  SaleItem,
  Product,
  HPPComponent,
  SellingMode,
  InventoryType,
  PaymentStatus,
  ProductSaleHistoryItem,
  ReceivableSummary,
  ReceivableSaleItem,
  ReceivablePaymentRecord,
} from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class SalesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesValidationError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export class TransactionCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionCollisionError';
  }
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  mode: SellingMode;
  unitPrice: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  paymentAmount: number;
  transactionDate?: string; // Optional 'YYYY-MM-DD', defaults to local business date
  customerName?: string;
  customerPhone?: string;
}

export interface RecordReceivablePaymentInput {
  saleId: string;
  amount: number;
  note?: string;
}

export interface GetSalesFilter {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  limit?: number;
}

// ─── Type Converters / Mappers ───────────────────────────────────────────────

type PrismaProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    recipeComponents: true;
  };
}>;

type PrismaSaleWithItems = Prisma.SaleGetPayload<{
  include: {
    items: true;
  };
}> & {
  receivablePayments?: Prisma.ReceivablePaymentGetPayload<Record<string, never>>[];
};

function toDomainProduct(p: PrismaProductWithRelations): Product {
  const hppComponents: HPPComponent[] = (p.recipeComponents || []).map((rc) => ({
    id: rc.id,
    name: rc.name,
    quantity: Number(rc.quantity),
    unit: rc.unit,
    unitCost: rc.unitCost,
    materialProductId: rc.materialProductId ?? undefined,
  }));

  return {
    id: p.id,
    name: p.name,
    variant: p.variant ?? undefined,
    family: p.family,
    category: p.category.name,
    inventoryType: p.inventoryType as InventoryType,
    price: p.price ?? undefined,
    preparedPrice: p.preparedPrice ?? undefined,
    costPrice: p.costPrice ?? undefined,
    stock: p.stock,
    minStock: p.minStock,
    unit: p.unit,
    iconName: p.iconName ?? undefined,
    isActive: p.isActive,
    hppComponents: hppComponents.length > 0 ? hppComponents : undefined,
    hppNote: p.hppNote ?? undefined,
  };
}

function toDomainSaleItem(item: Prisma.SaleItemGetPayload<Record<string, never>>): SaleItem {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    mode: item.mode as SellingMode,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    unitHpp: item.unitHpp,
    subtotal: item.subtotal,
    hppTotal: item.hppTotal,
  };
}

function toDomainReceivablePayment(rp: Prisma.ReceivablePaymentGetPayload<Record<string, never>>): ReceivablePaymentRecord {
  return {
    id: rp.id,
    saleId: rp.saleId,
    amount: rp.amount,
    note: rp.note ?? undefined,
    paidAt: rp.paidAt.toISOString(),
    createdAt: rp.createdAt.toISOString(),
  };
}

function toDomainSale(s: PrismaSaleWithItems): Sale {
  return {
    id: s.id,
    transactionNumber: s.transactionNumber,
    transactionDate: formatDateToIsoDate(s.transactionDate),
    items: s.items.map(toDomainSaleItem),
    totalAmount: s.totalAmount,
    totalHpp: s.totalHpp,
    grossProfit: s.grossProfit,
    paymentMethod: 'cash',
    paymentAmount: s.paymentAmount,
    changeAmount: s.changeAmount,
    paymentStatus: s.paymentStatus as PaymentStatus,
    amountPaid: s.amountPaid,
    amountDue: s.amountDue,
    initialAmountPaid: s.initialAmountPaid,   // Immutable snapshot — set at creation, never updated
    initialAmountDue: s.initialAmountDue,     // Immutable snapshot — set at creation, never updated
    customerName: s.customerName ?? undefined,
    customerPhone: s.customerPhone ?? undefined,
    receivablePayments: s.receivablePayments ? s.receivablePayments.map(toDomainReceivablePayment) : undefined,
    createdAt: s.createdAt.toISOString(),
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

// ─── Query Operations ────────────────────────────────────────────────────────

/**
 * Retrieves all sales, optionally filtered by date range and limit.
 */
export async function getSales(filter?: GetSalesFilter): Promise<Sale[]> {
  const where: Prisma.SaleWhereInput = {};

  if (filter?.startDate || filter?.endDate) {
    where.transactionDate = {};
    if (filter.startDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
        throw new SalesValidationError('Format startDate harus YYYY-MM-DD');
      }
      where.transactionDate.gte = parseDateToUtcMidnight(filter.startDate);
    }
    if (filter.endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
        throw new SalesValidationError('Format endDate harus YYYY-MM-DD');
      }
      where.transactionDate.lte = parseDateToUtcMidnight(filter.endDate);
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: [
      { transactionDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filter?.limit,
  });

  return sales.map(toDomainSale);
}

/**
 * Retrieves a single sale by ID.
 */
export async function getSaleById(id: string): Promise<Sale | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: true,
      receivablePayments: {
        orderBy: { paidAt: 'desc' },
      },
    },
  });

  return sale ? toDomainSale(sale) : null;
}

/**
 * Retrieves sales history for a specific product.
 */
export async function getSalesByProductId(
  productId: string,
  limit: number = 50
): Promise<ProductSaleHistoryItem[]> {
  const items = await prisma.saleItem.findMany({
    where: { productId },
    include: {
      sale: {
        select: {
          id: true,
          transactionNumber: true,
          transactionDate: true,
          paymentStatus: true,
          customerName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return items.map((item) => ({
    saleId: item.sale.id,
    transactionNumber: item.sale.transactionNumber,
    transactionDate: formatDateToIsoDate(item.sale.transactionDate),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    mode: item.mode as SellingMode,
    paymentStatus: item.sale.paymentStatus as PaymentStatus,
    customerName: item.sale.customerName ?? undefined,
    createdAt: item.createdAt.toISOString(),
  }));
}

/**
 * Retrieves grouped outstanding receivables summary by customerName.
 */
export async function getReceivableSummary(): Promise<ReceivableSummary[]> {
  const outstandingSales = await prisma.sale.findMany({
    where: {
      amountDue: { gt: 0 },
      customerName: { not: null },
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  const customerMap = new Map<string, ReceivableSummary>();

  for (const sale of outstandingSales) {
    const custName = sale.customerName!.trim();
    const existing = customerMap.get(custName);

    const saleItem: ReceivableSaleItem = {
      id: sale.id,
      transactionNumber: sale.transactionNumber,
      transactionDate: formatDateToIsoDate(sale.transactionDate),
      totalAmount: sale.totalAmount,
      amountPaid: sale.amountPaid,
      amountDue: sale.amountDue,
      paymentStatus: sale.paymentStatus as PaymentStatus,
    };

    if (existing) {
      existing.totalDue += sale.amountDue;
      existing.saleCount += 1;
      existing.sales.push(saleItem);
      if (!existing.customerPhone && sale.customerPhone) {
        existing.customerPhone = sale.customerPhone;
      }
    } else {
      customerMap.set(custName, {
        customerName: custName,
        customerPhone: sale.customerPhone ?? undefined,
        totalDue: sale.amountDue,
        saleCount: 1,
        sales: [saleItem],
      });
    }
  }

  return Array.from(customerMap.values()).sort((a, b) => b.totalDue - a.totalDue);
}

/**
 * Records a settlement payment for a specific outstanding sale.
 */
export async function recordReceivablePayment(
  input: RecordReceivablePaymentInput
): Promise<Sale> {
  const { saleId, amount, note } = input;

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    throw new SalesValidationError('Nominal pembayaran piutang harus bilangan bulat lebih dari 0');
  }

  return await prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
      });

      if (!sale) {
        throw new SalesValidationError('Transaksi penjualan tidak ditemukan');
      }

      if (sale.amountDue <= 0) {
        throw new SalesValidationError('Transaksi ini sudah lunas');
      }

      if (amount > sale.amountDue) {
        throw new SalesValidationError(
          `Nominal pembayaran (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa piutang (Rp ${sale.amountDue.toLocaleString('id-ID')})`
        );
      }

      const newAmountPaid = sale.amountPaid + amount;
      const newAmountDue = sale.totalAmount - newAmountPaid;
      const newStatus: PaymentStatus = newAmountDue === 0 ? 'paid' : 'partial';

      await tx.receivablePayment.create({
        data: {
          saleId: sale.id,
          amount,
          note: note ? note.trim() : null,
          paidAt: new Date(),
        },
      });

      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          paymentStatus: newStatus,
        },
        include: {
          items: true,
          receivablePayments: {
            orderBy: { paidAt: 'desc' },
          },
        },
      });

      return toDomainSale(updatedSale);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Creates a new sale with atomic stock deduction, frozen financial snapshots,
 * StockAdjustmentLog generation, and bounded retry for unique transactionNumber collisions.
 */
export async function createSale(input: CreateSaleInput): Promise<Sale> {
  // 1. Pre-transaction validation
  if (!input.items || input.items.length === 0) {
    throw new SalesValidationError('Keranjang belanja tidak boleh kosong');
  }

  if (typeof input.paymentAmount !== 'number' || input.paymentAmount < 0 || !Number.isInteger(input.paymentAmount)) {
    throw new SalesValidationError('Nominal pembayaran harus berupa bilangan bulat non-negatif');
  }

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.productId || typeof item.productId !== 'string') {
      throw new SalesValidationError(`Item baris ke-${i + 1} tidak memiliki productId yang valid`);
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new SalesValidationError(`Jumlah barang pada baris ke-${i + 1} harus berupa bilangan bulat lebih besar dari 0`);
    }
    if (typeof item.unitPrice !== 'number' || !Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      throw new SalesValidationError(`Harga satuan pada baris ke-${i + 1} harus berupa bilangan bulat non-negatif`);
    }
    if (item.mode !== 'direct' && item.mode !== 'brewed') {
      throw new SalesValidationError(`Mode penjualan pada baris ke-${i + 1} harus "direct" atau "brewed"`);
    }
  }

  const txDateStr = input.transactionDate ?? getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(txDateStr)) {
    throw new SalesValidationError('Format transactionDate harus YYYY-MM-DD');
  }

  const dateSuffix = txDateStr.replace(/-/g, '');
  const parsedTxDate = parseDateToUtcMidnight(txDateStr);

  let lastError: unknown;

  // 2. Bounded retry loop for transactionNumber collisions
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Step 1: Determine candidate transactionNumber
          const existingCount = await tx.sale.count({
            where: { transactionDate: parsedTxDate },
          });
          const candidateSeq = existingCount + attempt;
          const candidateTransactionNumber = `TRX-${dateSuffix}-${String(candidateSeq).padStart(3, '0')}`;

          // Step 2: Fetch and validate all referenced products
          const distinctProductIds = Array.from(new Set(input.items.map((it) => it.productId)));
          const products = await tx.product.findMany({
            where: {
              id: { in: distinctProductIds },
              isActive: true,
            },
            include: {
              category: true,
              recipeComponents: {
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          const productMap = new Map<string, PrismaProductWithRelations>();
          for (const p of products) {
            productMap.set(p.id, p);
          }

          for (const pid of distinctProductIds) {
            if (!productMap.has(pid)) {
              throw new ProductNotFoundError(
                `Produk dengan ID "${pid}" tidak ditemukan atau sudah tidak aktif`
              );
            }
          }

          // Step 3: Calculate financials and freeze SaleItem snapshots
          let totalAmount = 0;
          let totalHpp = 0;

          const saleItemsData: Array<{
            productId: string;
            productName: string;
            mode: SellingMode;
            quantity: number;
            unit: string;
            unitPrice: number;
            unitHpp: number;
            subtotal: number;
            hppTotal: number;
          }> = [];

          for (const item of input.items) {
            const prismaProduct = productMap.get(item.productId)!;
            const domainProduct = toDomainProduct(prismaProduct);

            const unitHpp = calculateHPP(domainProduct);
            const subtotal = item.unitPrice * item.quantity;
            const hppTotal = unitHpp * item.quantity;

            totalAmount += subtotal;
            totalHpp += hppTotal;

            saleItemsData.push({
              productId: item.productId,
              productName: domainProduct.name,
              mode: item.mode,
              quantity: item.quantity,
              unit: domainProduct.unit,
              unitPrice: item.unitPrice,
              unitHpp,
              subtotal,
              hppTotal,
            });
          }

          let paymentStatus: PaymentStatus;
          let amountPaid: number;
          let amountDue: number;
          let changeAmount: number;

          if (input.paymentAmount >= totalAmount) {
            paymentStatus = 'paid';
            amountPaid = totalAmount;
            amountDue = 0;
            changeAmount = input.paymentAmount - totalAmount;
          } else if (input.paymentAmount > 0) {
            paymentStatus = 'partial';
            amountPaid = input.paymentAmount;
            amountDue = totalAmount - input.paymentAmount;
            changeAmount = 0;
          } else {
            paymentStatus = 'unpaid';
            amountPaid = 0;
            amountDue = totalAmount;
            changeAmount = 0;
          }

          // Immutable payment snapshot — frozen at creation, never modified by later settlements.
          // initialAmountPaid = amountPaid at creation  (= min(paymentAmount, totalAmount), never raw paymentAmount)
          // initialAmountDue  = amountDue  at creation  (= totalAmount - initialAmountPaid)
          // Invariant: initialAmountPaid + initialAmountDue = totalAmount (always)
          const initialAmountPaid = amountPaid;
          const initialAmountDue = amountDue;

          const trimmedCustomerName = input.customerName ? input.customerName.trim() : undefined;
          const trimmedCustomerPhone = input.customerPhone ? input.customerPhone.trim() : undefined;

          if (paymentStatus !== 'paid' && !trimmedCustomerName) {
            throw new SalesValidationError('Nama pelanggan wajib diisi untuk transaksi belum lunas / piutang');
          }

          const grossProfit = totalAmount - totalHpp;

          // Step 3b: Build linked material consumption map.
          // For each sale item, iterate its recipe components and accumulate
          // required stock per materialProductId.  Components with
          // materialProductId == null are legacy/HPP-only — skip them entirely.
          const materialConsumption = new Map<string, number>();

          for (const item of input.items) {
            const prismaProduct = productMap.get(item.productId)!;

            for (const rc of prismaProduct.recipeComponents) {
              if (rc.materialProductId == null) {
                // Legacy component: affects HPP only, never consumes stock.
                continue;
              }

              const recipeQty = Number(rc.quantity);

              // Defensive guard: linked quantities must be integers.
              // The products service enforces this at write time, but pre-existing
              // data could violate the rule.  Block the sale rather than silently
              // rounding or corrupting integer stock.
              if (!Number.isInteger(recipeQty) || recipeQty < 1) {
                throw new SalesValidationError(
                  `Komponen resep "${rc.name}" pada produk "${prismaProduct.name}" memiliki jumlah non-integer (${rc.quantity}) untuk bahan stok terhubung. Perbarui resep terlebih dahulu.`
                );
              }

              const required = recipeQty * item.quantity;
              const current = materialConsumption.get(rc.materialProductId) || 0;
              materialConsumption.set(rc.materialProductId, current + required);
            }
          }

          // Step 3c: Fetch and validate all required material Products.
          // Performed inside the same transaction so the existence check is
          // consistent with the subsequent stock mutation.
          const materialProductMap = new Map<string, { id: string; name: string; unit: string }>();

          if (materialConsumption.size > 0) {
            const materialIds = Array.from(materialConsumption.keys());
            const materialProducts = await tx.product.findMany({
              where: {
                id: { in: materialIds },
                isActive: true,
              },
              select: { id: true, name: true, unit: true },
            });

            for (const mp of materialProducts) {
              materialProductMap.set(mp.id, mp);
            }

            // Verify every required material exists and is active.
            for (const matId of materialIds) {
              if (!materialProductMap.has(matId)) {
                throw new ProductNotFoundError(
                  `Produk bahan dengan ID "${matId}" tidak ditemukan atau sudah tidak aktif.`
                );
              }
            }

            // Option B: emit a console warning (non-blocking) when recipe unit
            // differs from the material product's unit.  The sale proceeds;
            // no conversion is applied.
            for (const item of input.items) {
              const pp = productMap.get(item.productId)!;
              for (const rc of pp.recipeComponents) {
                if (rc.materialProductId == null) continue;
                const mp = materialProductMap.get(rc.materialProductId);
                if (mp && rc.unit.trim().toLowerCase() !== mp.unit.trim().toLowerCase()) {
                  console.warn(
                    `[Sales] Unit mismatch on ${candidateTransactionNumber}: ` +
                    `recipe component "${rc.name}" unit="${rc.unit}" vs ` +
                    `material product "${mp.name}" unit="${mp.unit}". ` +
                    `Consuming ${Number(rc.quantity) * item.quantity} units as-is (no conversion).`
                  );
                }
              }
            }
          }

          // Step 4: Aggregate ALL required stock deductions — finished products
          // AND linked material products — into a single map before any mutation.
          // This prevents independent per-product checks passing while the
          // combined total exceeds available stock.
          const aggregatedStockReq = new Map<string, number>();

          // Finished-product quantities (existing behavior).
          for (const item of input.items) {
            const current = aggregatedStockReq.get(item.productId) || 0;
            aggregatedStockReq.set(item.productId, current + item.quantity);
          }

          // Material consumption requirements (new).
          for (const [matId, qty] of materialConsumption) {
            const current = aggregatedStockReq.get(matId) || 0;
            aggregatedStockReq.set(matId, current + qty);
          }

          // Combined lookup map for name resolution in error messages.
          // Finished products are already in productMap; materials are in materialProductMap.
          const combinedProductNameMap = new Map<string, string>();
          for (const [id, p] of productMap) {
            combinedProductNameMap.set(id, p.name);
          }
          for (const [id, mp] of materialProductMap) {
            combinedProductNameMap.set(id, mp.name);
          }

          // Deterministic sort order to prevent lock-order inversion between concurrent sales.
          // ALL product IDs (finished + material) are sorted together.
          const sortedProductIds = Array.from(aggregatedStockReq.keys()).sort((a, b) =>
            a.localeCompare(b)
          );

          // Step 5: Concurrency-safe atomic conditional stock deduction
          for (const productId of sortedProductIds) {
            const requiredQty = aggregatedStockReq.get(productId)!;
            const productName = combinedProductNameMap.get(productId) ?? productId;

            const updateResult = await tx.product.updateMany({
              where: {
                id: productId,
                stock: { gte: requiredQty },
              },
              data: {
                stock: { decrement: requiredQty },
              },
            });

            if (updateResult.count === 0) {
              throw new InsufficientStockError(
                `Stok produk "${productName}" tidak mencukupi untuk transaksi ini.`
              );
            }

            // Step 6: Query updated live balance & create StockAdjustmentLog
            const updated = await tx.product.findUniqueOrThrow({
              where: { id: productId },
              select: { stock: true },
            });

            const newStock = updated.stock;
            const previousStock = newStock + requiredQty;

            await tx.stockAdjustmentLog.create({
              data: {
                productId,
                type: 'reduce',
                amount: requiredQty,
                previousStock,
                newStock,
                reason: 'penjualan',
                note: `Penjualan ${candidateTransactionNumber}`,
              },
            });
          }

          // Step 7: Create Sale & SaleItems
          const createdSale = await tx.sale.create({
            data: {
              transactionNumber: candidateTransactionNumber,
              transactionDate: parsedTxDate,
              totalAmount,
              totalHpp,
              grossProfit,
              paymentMethod: 'cash',
              paymentAmount: input.paymentAmount,
              changeAmount,
              paymentStatus,
              amountPaid,
              amountDue,
              initialAmountPaid,    // Immutable snapshot: cash applied at Sale creation
              initialAmountDue,     // Immutable snapshot: receivable created at Sale creation
              customerName: trimmedCustomerName || null,
              customerPhone: trimmedCustomerPhone || null,
              items: {
                create: saleItemsData,
              },
            },
            include: {
              items: true,
              receivablePayments: true,
            },
          });

          return toDomainSale(createdSale);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 5000,
          timeout: 15000,
        }
      );
    } catch (error) {
      lastError = error;

      // Handle unique constraint collision on transactionNumber
      const isCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (String(error.meta?.target || '').includes('transactionNumber') ||
          (Array.isArray(error.meta?.target) && error.meta.target.includes('transactionNumber')));

      if (isCollision) {
        // Retry full transaction on next attempt with incremented offset
        continue;
      }

      // Non-collision errors fail immediately
      throw error;
    }
  }

  throw new TransactionCollisionError(
    `Gagal membuat transaksi penjualan setelah ${MAX_RETRY_ATTEMPTS} kali percobaan karena konflik nomor transaksi. Silakan coba lagi.${lastError instanceof Error ? ` Detail: ${lastError.message}` : ''
    }`
  );
}

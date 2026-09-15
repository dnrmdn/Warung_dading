import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  Product,
  HPPComponent,
  CreateProductInput,
  UpdateProductInput,
  AdjustStockInput,
  StockAdjustmentLog,
  StockAdjustmentType,
  StockAdjustmentReason,
  InventoryType,
} from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Type Converters / Mappers ───────────────────────────────────────────────

type PrismaProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    recipeComponents: true;
  };
}>;

function toDomainProduct(p: PrismaProductWithRelations): Product {
  const hppComponents: HPPComponent[] = (p.recipeComponents || []).map((rc) => ({
    id: rc.id,
    name: rc.name,
    quantity: Number(rc.quantity),
    unit: rc.unit,
    unitCost: rc.unitCost,
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

function toDomainStockLog(log: {
  id: string;
  productId: string;
  type: string;
  amount: number;
  previousStock: number;
  newStock: number;
  reason: string;
  note: string | null;
  createdAt: Date;
}): StockAdjustmentLog {
  return {
    id: log.id,
    productId: log.productId,
    type: log.type as StockAdjustmentType,
    amount: log.amount,
    previousStock: log.previousStock,
    newStock: log.newStock,
    reason: log.reason as StockAdjustmentReason,
    note: log.note ?? undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

// ─── 1. Category Operations ──────────────────────────────────────────────────

/**
 * Retrieves all unique category names.
 */
export async function getCategories(): Promise<string[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { name: true },
  });
  return categories.map((c) => c.name);
}

// ─── 2. Product Query Operations ─────────────────────────────────────────────

/**
 * Retrieves all products, optionally including inactive/archived products.
 */
export async function getProducts(options?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    include: {
      category: true,
      recipeComponents: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ family: 'asc' }, { name: 'asc' }],
  });

  return products.map(toDomainProduct);
}

/**
 * Retrieves a single product by ID.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      recipeComponents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return product ? toDomainProduct(product) : null;
}

/**
 * Retrieves products whose stock is at or below their minStock threshold.
 */
export async function getLowStockProducts(): Promise<Product[]> {
  const allActiveProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      recipeComponents: true,
    },
    orderBy: { stock: 'asc' },
  });

  return allActiveProducts
    .filter((p) => p.stock <= p.minStock)
    .map(toDomainProduct);
}

// ─── 3. Product CRUD Operations ──────────────────────────────────────────────

/**
 * Creates a new product and connects its category and recipe components.
 * Requires that the specified category already exists in the database.
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!input.name || !input.name.trim()) {
    throw new Error('Nama produk wajib diisi.');
  }
  if (!input.family || !input.family.trim()) {
    throw new Error('Family/Merk produk wajib diisi.');
  }
  if (!input.category || !input.category.trim()) {
    throw new Error('Kategori produk wajib diisi.');
  }
  if (!input.unit || !input.unit.trim()) {
    throw new Error('Satuan produk wajib diisi.');
  }
  if (typeof input.stock !== 'number' || isNaN(input.stock) || input.stock < 0) {
    throw new Error('Stok awal harus berupa angka non-negatif yang valid.');
  }
  if (typeof input.minStock !== 'number' || isNaN(input.minStock) || input.minStock < 0) {
    throw new Error('Batas minimum stok harus berupa angka non-negatif yang valid.');
  }

  const categoryName = input.category.trim();

  // Validate that the category exists
  const category = await prisma.category.findUnique({
    where: { name: categoryName },
  });

  if (!category) {
    throw new Error(`Kategori "${categoryName}" tidak ditemukan.`);
  }

  const created = await prisma.product.create({
    data: {
      name: input.name.trim(),
      variant: input.variant?.trim() || null,
      family: input.family.trim(),
      categoryId: category.id,
      inventoryType: input.inventoryType,
      price: input.price ?? null,
      preparedPrice: input.preparedPrice ?? null,
      costPrice: input.costPrice ?? null,
      stock: input.stock,
      minStock: input.minStock,
      unit: input.unit.trim(),
      iconName: input.iconName?.trim() || null,
      isActive: input.isActive ?? true,
      hppNote: input.hppNote?.trim() || null,
      recipeComponents: input.hppComponents && input.hppComponents.length > 0
        ? {
            create: input.hppComponents.map((c) => ({
              name: c.name.trim(),
              quantity: new Prisma.Decimal(c.quantity),
              unit: c.unit.trim(),
              unitCost: c.unitCost,
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      recipeComponents: true,
    },
  });

  return toDomainProduct(created);
}

/**
 * Updates an existing product's fields and/or recipe components atomically.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existing) {
    throw new Error(`Produk dengan ID "${id}" tidak ditemukan.`);
  }

  let categoryId = existing.categoryId;
  if (input.category && input.category.trim()) {
    const categoryName = input.category.trim();
    const category = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new Error(`Kategori "${categoryName}" tidak ditemukan.`);
    }

    categoryId = category.id;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Synchronize recipe components if provided in updates
    if (input.hppComponents !== undefined) {
      await tx.recipeComponent.deleteMany({
        where: { productId: id },
      });

      if (input.hppComponents.length > 0) {
        await tx.recipeComponent.createMany({
          data: input.hppComponents.map((c) => ({
            productId: id,
            name: c.name.trim(),
            quantity: new Prisma.Decimal(c.quantity),
            unit: c.unit.trim(),
            unitCost: c.unitCost,
          })),
        });
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        variant: input.variant !== undefined ? (input.variant?.trim() || null) : undefined,
        family: input.family !== undefined ? input.family.trim() : undefined,
        categoryId: input.category !== undefined ? categoryId : undefined,
        inventoryType: input.inventoryType !== undefined ? input.inventoryType : undefined,
        price: input.price !== undefined ? (input.price ?? null) : undefined,
        preparedPrice: input.preparedPrice !== undefined ? (input.preparedPrice ?? null) : undefined,
        costPrice: input.costPrice !== undefined ? (input.costPrice ?? null) : undefined,
        stock: input.stock !== undefined ? input.stock : undefined,
        minStock: input.minStock !== undefined ? input.minStock : undefined,
        unit: input.unit !== undefined ? input.unit.trim() : undefined,
        iconName: input.iconName !== undefined ? (input.iconName?.trim() || null) : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        hppNote: input.hppNote !== undefined ? (input.hppNote?.trim() || null) : undefined,
      },
      include: {
        category: true,
        recipeComponents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  return toDomainProduct(updated);
}

/**
 * Soft-archives a product by setting isActive = false.
 * Preserves all historical sales and purchase transaction references.
 */
export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error(`Produk dengan ID "${id}" tidak ditemukan.`);
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

// ─── 4. Recipe Component Query & Synchronization ─────────────────────────────

/**
 * Retrieves recipe components for a specific product.
 */
export async function getRecipeComponents(productId: string): Promise<HPPComponent[]> {
  const components = await prisma.recipeComponent.findMany({
    where: { productId },
    orderBy: { createdAt: 'asc' },
  });

  return components.map((rc) => ({
    id: rc.id,
    name: rc.name,
    quantity: Number(rc.quantity),
    unit: rc.unit,
    unitCost: rc.unitCost,
  }));
}

// ─── 5. Concurrency-Safe Stock Adjustments ────────────────────────────────────

/**
 * Concurrency-safe manual inventory adjustment supporting 'add', 'reduce', and 'set'.
 * Uses atomic in-database updates and pessimistic row locking to prevent lost updates.
 */
export async function adjustStock(input: AdjustStockInput): Promise<StockAdjustmentLog> {
  const { productId, type, amount, reason, note } = input;

  if (!productId || !productId.trim()) {
    throw new Error('ID produk wajib diisi.');
  }

  const validReasons: StockAdjustmentReason[] = [
    'pembelian',
    'penjualan',
    'retur_supplier',
    'rusak_kadaluarsa',
    'pemakaian_sendiri',
    'koreksi_opname',
    'lainnya',
  ];

  if (!validReasons.includes(reason)) {
    throw new Error(`Alasan penyesuaian stok tidak valid: "${reason}".`);
  }

  if (typeof amount !== 'number' || isNaN(amount) || !Number.isFinite(amount)) {
    throw new Error('Nilai jumlah penyesuaian stok tidak valid.');
  }

  if (type === 'add' || type === 'reduce') {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new Error(`Jumlah untuk "${type}" harus berupa bilangan bulat positif.`);
    }
  } else if (type === 'set') {
    if (amount < 0 || !Number.isInteger(amount)) {
      throw new Error('Nilai stok baru untuk "set" harus berupa bilangan bulat non-negatif.');
    }
  } else {
    throw new Error(`Tipe penyesuaian tidak valid: "${type}".`);
  }

  return await prisma.$transaction(async (tx) => {
    if (type === 'add') {
      // 1. Atomic in-database increment
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: amount },
        },
        select: { stock: true },
      });

      const newStock = updated.stock;
      const previousStock = newStock - amount;

      const log = await tx.stockAdjustmentLog.create({
        data: {
          productId,
          type: 'add',
          amount,
          previousStock,
          newStock,
          reason,
          note: note?.trim() || null,
        },
      });

      return toDomainStockLog(log);
    }

    if (type === 'reduce') {
      // 2. Atomic conditional in-database decrement
      const updateResult = await tx.product.updateMany({
        where: {
          id: productId,
          stock: { gte: amount },
        },
        data: {
          stock: { decrement: amount },
        },
      });

      if (updateResult.count === 0) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { name: true, stock: true },
        });

        if (!product) {
          throw new Error(`Produk dengan ID "${productId}" tidak ditemukan.`);
        }

        throw new Error(
          `Jumlah pengurangan (${amount}) melebihi stok yang tersedia (${product.stock}).`
        );
      }

      const updated = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: { stock: true },
      });

      const newStock = updated.stock;
      const previousStock = newStock + amount;

      const log = await tx.stockAdjustmentLog.create({
        data: {
          productId,
          type: 'reduce',
          amount,
          previousStock,
          newStock,
          reason,
          note: note?.trim() || null,
        },
      });

      return toDomainStockLog(log);
    }

    // 3. 'set': Pessimistic row locking via SELECT ... FOR UPDATE
    // Product.id is PostgreSQL TEXT (String @default(uuid()) without @db.Uuid).
    // Prisma tagged template passes the JS string parameter directly as TEXT.
    const lockedProducts = await tx.$queryRaw<Array<{ id: string; stock: number }>>`
      SELECT id, stock FROM "Product" WHERE id = ${productId} FOR UPDATE
    `;

    const lockedProduct = lockedProducts[0];
    if (!lockedProduct) {
      throw new Error(`Produk dengan ID "${productId}" tidak ditemukan.`);
    }

    const previousStock = lockedProduct.stock;
    const newStock = amount;
    const adjustmentAmount = Math.abs(newStock - previousStock);

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    const log = await tx.stockAdjustmentLog.create({
      data: {
        productId,
        type: 'set',
        amount: adjustmentAmount,
        previousStock,
        newStock,
        reason,
        note: note?.trim() || null,
      },
    });

    return toDomainStockLog(log);
  });
}

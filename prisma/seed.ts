import crypto from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_PURCHASES,
  MOCK_EXPENSES,
} from '../lib/mock/warung-data';

const prisma = new PrismaClient();

/**
 * Deterministically generates a UUID v4-like identifier from a namespace and key.
 * Guarantees that the exact same key always resolves to the exact same UUID.
 */
function toDeterministicUuid(namespace: string, key: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`warung-smart:${namespace}:${key}`)
    .digest('hex');


  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

async function main() {
  console.log('🌱 Starting Warung Smart database seed...');

  // ─── 1. Categories ──────────────────────────────────────────────────────────
  // Filter out UI-only tab 'Semua'
  const approvedCategories = MOCK_CATEGORIES.filter((cat) => cat !== 'Semua');
  const categoryMap = new Map<string, string>();

  console.log(`📦 Seeding ${approvedCategories.length} categories...`);
  for (const name of approvedCategories) {
    const categoryId = toDeterministicUuid('category', name);
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        id: categoryId,
        name,
      },
    });
    categoryMap.set(name, category.id);
  }

  // ─── 2. Products ────────────────────────────────────────────────────────────
  console.log(`🛒 Seeding ${MOCK_PRODUCTS.length} products...`);
  const productUuidMap = new Map<string, string>();

  for (const product of MOCK_PRODUCTS) {
    const categoryId = categoryMap.get(product.category);
    if (!categoryId) {
      throw new Error(
        `Kategori "${product.category}" untuk produk "${product.name}" (${product.id}) tidak ditemukan dalam database.`
      );
    }

    const productId = toDeterministicUuid('product', product.id);
    productUuidMap.set(product.id, productId);

    const productPayload = {
      name: product.name,
      variant: product.variant ?? null,
      family: product.family,
      categoryId,
      inventoryType: product.inventoryType,
      price: product.price ?? null,
      preparedPrice: product.preparedPrice ?? null,
      costPrice: product.costPrice ?? null,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      iconName: product.iconName ?? null,
      isActive: product.isActive,
      hppNote: product.hppNote ?? null,
    };

    await prisma.product.upsert({
      where: { id: productId },
      update: productPayload,
      create: {
        id: productId,
        ...productPayload,
      },
    });

    // ─── 3. Recipe Components (HPP) ───────────────────────────────────────────
    // Reconcile recipe components per product (seed-only synchronization)
    if (product.hppComponents && product.hppComponents.length > 0) {
      await prisma.recipeComponent.deleteMany({
        where: { productId },
      });

      for (const comp of product.hppComponents) {
        const recipeId = toDeterministicUuid('recipe', `${product.id}:${comp.id}`);
        await prisma.recipeComponent.create({
          data: {
            id: recipeId,
            productId,
            name: comp.name,
            quantity: new Prisma.Decimal(comp.quantity),
            unit: comp.unit,
            unitCost: comp.unitCost,
          },
        });
      }
    }
  }

  // ─── 4. Purchases & Purchase Items ─────────────────────────────────────────
  console.log(`📑 Seeding ${MOCK_PURCHASES.length} purchases...`);
  for (const purchase of MOCK_PURCHASES) {
    const purchaseId = toDeterministicUuid('purchase', purchase.id);
    const purchaseDate = new Date(`${purchase.purchaseDate}T00:00:00.000Z`);

    const purchasePayload = {
      purchaseDate,
      supplierName: purchase.supplierName ?? null,
      totalAmount: purchase.totalAmount,
      note: purchase.note ?? null,
    };

    await prisma.purchase.upsert({
      where: { id: purchaseId },
      update: purchasePayload,
      create: {
        id: purchaseId,
        ...purchasePayload,
      },
    });

    for (const item of purchase.items) {
      const productId = productUuidMap.get(item.productId);
      if (!productId) {
        throw new Error(
          `Produk dengan ID "${item.productId}" pada pembelian "${purchase.id}" tidak ditemukan.`
        );
      }

      const purchaseItemId = toDeterministicUuid(
        'purchase_item',
        `${purchase.id}:${item.id}`
      );

      const itemPayload = {
        purchaseId,
        productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        subtotal: item.subtotal,
      };

      await prisma.purchaseItem.upsert({
        where: { id: purchaseItemId },
        update: itemPayload,
        create: {
          id: purchaseItemId,
          ...itemPayload,
        },
      });
    }
  }

  // ─── 5. Expenses ────────────────────────────────────────────────────────────
  console.log(`💸 Seeding ${MOCK_EXPENSES.length} expenses...`);
  for (const expense of MOCK_EXPENSES) {
    const expenseId = toDeterministicUuid('expense', expense.id);
    const expenseDate = new Date(`${expense.expenseDate}T00:00:00.000Z`);

    const expensePayload = {
      expenseDate,
      category: expense.category,
      amount: expense.amount,
      description: expense.description ?? null,
    };

    await prisma.expense.upsert({
      where: { id: expenseId },
      update: expensePayload,
      create: {
        id: expenseId,
        ...expensePayload,
      },
    });
  }

  // ─── 6. Sales & Stock Logs ──────────────────────────────────────────────────
  // Per Phase 4 approved architecture:
  // - Sale and SaleItem remain empty (0 records) to start from clean real POS sales.
  // - StockAdjustmentLog remains empty (0 records); Product.stock is the seeded baseline.

  console.log('✅ Seed data preparation completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

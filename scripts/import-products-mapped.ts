import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CsvProductRow {
  id: string;
  name: string;
  variant: string | null;
  family: string;
  categoryName: string;
  inventoryType: string;
  price: number | null;
  preparedPrice: number | null;
  costPrice: number | null;
  stock: number;
  minStock: number;
  unit: string;
  iconName: string | null;
  isActive: boolean;
  hppNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Standard RFC-4180 CSV parser handling quoted fields, commas, escaped quotes, newlines.
 */
function parseCsv(csvContent: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip next escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell);
        currentCell = '';
        if (currentRow.some((c) => c.trim().length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell);
        currentCell = '';
        if (currentRow.some((c) => c.trim().length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((c) => c.trim().length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  const headers = lines[0].map((h) => h.trim());
  const rows = lines.slice(1);

  return { headers, rows };
}

function parseNullableInt(val: string): number | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return null;
  return num;
}

function parseNullableString(val: string): string | null {
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function main() {
  console.log('=== STARTING CSV IMPORT TO NEW DATABASE ===\n');

  const csvPath = path.resolve(process.cwd(), 'products_mapped.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`products_mapped.csv not found at ${csvPath}`);
  }

  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const { headers, rows } = parseCsv(csvRaw);

  console.log(`Headers found (${headers.length}):`, headers.join(', '));
  console.log(`Total data rows found in CSV: ${rows.length}`);

  if (rows.length !== 68) {
    throw new Error(`Expected exactly 68 product rows, but found ${rows.length}`);
  }

  const headerIndexMap = new Map<string, number>();
  headers.forEach((h, idx) => headerIndexMap.set(h, idx));

  const getCol = (row: string[], colName: string): string => {
    const idx = headerIndexMap.get(colName);
    if (idx === undefined || idx >= row.length) return '';
    return row[idx];
  };

  // Map and validate rows
  const parsedProducts: CsvProductRow[] = [];
  const categoryCounts: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = getCol(row, 'id').trim();
    const name = getCol(row, 'name').trim();
    const variant = parseNullableString(getCol(row, 'variant'));
    const family = getCol(row, 'family').trim();
    const categoryName = getCol(row, 'categoryName').trim();
    const inventoryType = getCol(row, 'inventoryType').trim();
    const price = parseNullableInt(getCol(row, 'price'));
    const preparedPrice = parseNullableInt(getCol(row, 'preparedPrice'));
    const costPrice = parseNullableInt(getCol(row, 'costPrice'));
    const stock = parseInt(getCol(row, 'stock').trim(), 10);
    const minStock = parseInt(getCol(row, 'minStock').trim(), 10);
    const unit = getCol(row, 'unit').trim();
    const iconName = parseNullableString(getCol(row, 'iconName'));
    const isActiveStr = getCol(row, 'isActive').trim().toLowerCase();
    const isActive = isActiveStr === 'true';
    const hppNote = parseNullableString(getCol(row, 'hppNote'));
    const createdAtRaw = getCol(row, 'createdAt').trim();
    const updatedAtRaw = getCol(row, 'updatedAt').trim();

    if (!id || !name || !family || !categoryName || !inventoryType || !unit) {
      throw new Error(`Row ${i + 1} has missing required fields: ${JSON.stringify(row)}`);
    }

    if (isNaN(stock) || isNaN(minStock)) {
      throw new Error(`Row ${i + 1} (${name}) has invalid numeric values for stock or minStock`);
    }

    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;

    parsedProducts.push({
      id,
      name,
      variant,
      family,
      categoryName,
      inventoryType,
      price,
      preparedPrice,
      costPrice,
      stock,
      minStock,
      unit,
      iconName,
      isActive,
      hppNote,
      createdAt: new Date(createdAtRaw),
      updatedAt: new Date(updatedAtRaw),
    });
  }

  // 1. Report Dynamic Category Distribution directly from CSV
  console.log('\n--- Actual Category Distribution (From CSV) ---');
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count} products`);
  });
  const uniqueCategories = Object.keys(categoryCounts).sort();
  console.log(`Total distinct categories found: ${uniqueCategories.length} -> [${uniqueCategories.join(', ')}]`);

  const expectedCategories = ['Bumbu', 'Es Cekek', 'Kopi & Susu', 'Mie', 'Sabun', 'Snack'];
  const categoriesMatch =
    uniqueCategories.length === expectedCategories.length &&
    uniqueCategories.every((cat, idx) => cat === expectedCategories[idx]);

  if (!categoriesMatch) {
    throw new Error(
      `Category mismatch! Found [${uniqueCategories.join(', ')}], expected [${expectedCategories.join(', ')}]`
    );
  }

  // 2. Pre-flight Product ID Conflict Check BEFORE any DB write
  console.log('\n--- Pre-flight Product ID Conflict Check ---');
  const productIds = parsedProducts.map((p) => p.id);
  const conflictingProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (conflictingProducts.length > 0) {
    console.error(`❌ CONFLICT DETECTED: Found ${conflictingProducts.length} existing products with matching IDs:`);
    conflictingProducts.forEach((cp) => console.error(`  - ID: ${cp.id} (Name: ${cp.name})`));
    console.error('Stopping immediately. No categories or products were created or modified.');
    process.exit(1);
  }

  console.log('✓ Product ID conflicts = 0. Safe to proceed.');

  // 3. Category Resolution (NO Category Upsert)
  console.log('\n--- Category Resolution (find or create) ---');
  const existingCategories = await prisma.category.findMany();
  const categoryMap = new Map<string, string>();
  existingCategories.forEach((c) => categoryMap.set(c.name, c.id));

  for (const catName of uniqueCategories) {
    if (categoryMap.has(catName)) {
      console.log(`  - Category "${catName}" already exists with ID: ${categoryMap.get(catName)}`);
    } else {
      const createdCategory = await prisma.category.create({
        data: { name: catName },
      });
      categoryMap.set(catName, createdCategory.id);
      console.log(`  + Created Category "${catName}" with ID: ${createdCategory.id}`);
    }
  }

  // 4. Product Creation (NO Product Upsert)
  console.log('\n--- Inserting Products using prisma.product.create ---');
  let insertedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const p of parsedProducts) {
      const categoryId = categoryMap.get(p.categoryName);
      if (!categoryId) {
        throw new Error(`Category ID not found in map for category "${p.categoryName}"`);
      }

      await tx.product.create({
        data: {
          id: p.id,
          name: p.name,
          variant: p.variant,
          family: p.family,
          categoryId,
          inventoryType: p.inventoryType,
          price: p.price,
          preparedPrice: p.preparedPrice,
          costPrice: p.costPrice,
          stock: p.stock,
          minStock: p.minStock,
          unit: p.unit,
          iconName: p.iconName,
          isActive: p.isActive,
          hppNote: p.hppNote,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
      });

      insertedCount++;
    }
  }, {
    timeout: 30000,
  });

  console.log(`✓ Successfully inserted ${insertedCount} products via prisma.product.create!`);

  // 5. Verification
  console.log('\n--- Final Database Status Verification ---');
  const totalCategoriesInDb = await prisma.category.count();
  const totalProductsInDb = await prisma.product.count();
  console.log(`Total Categories in Database: ${totalCategoriesInDb}`);
  console.log(`Total Products in Database: ${totalProductsInDb}`);

  // Query counts grouped by category
  const categoriesWithProducts = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\nProducts per Category in DB:');
  categoriesWithProducts.forEach((cat) => {
    console.log(`  - ${cat.name}: ${cat._count.products} products`);
  });

  console.log('\n=== CSV IMPORT COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((err) => {
    console.error('❌ Import failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';

/**
 * Escape string for RFC-4180 CSV format.
 * Null/undefined becomes empty string. Quotes are escaped by doubling.
 */
function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // If value contains comma, newline, or double-quote, wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function generateCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.join(',');
  const lines = rows.map((row) =>
    headers.map((h) => toCsvCell(row[h])).join(',')
  );
  return [headerLine, ...lines].join('\r\n') + '\r\n';
}

async function exportCatalog() {
  console.log('=== Exporting Category & Product to CSV from OLD_DATABASE_URL ===\n');

  const oldDatabaseUrl = process.env.OLD_DATABASE_URL?.trim();

  if (!oldDatabaseUrl) {
    console.error('❌ Error: OLD_DATABASE_URL environment variable is missing.');
    console.error('Please set $env:OLD_DATABASE_URL before running this script.');
    process.exit(1);
  }

  // Read-only client targeting OLD database
  const prismaOld = new PrismaClient({
    datasources: {
      db: {
        url: oldDatabaseUrl,
      },
    },
  });

  const exportDir = path.resolve(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  try {
    // 1. Export Category
    console.log('Fetching Category table...');
    const categories = await prismaOld.category.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const categoryHeaders = ['id', 'name', 'createdAt', 'updatedAt'];
    const categoryCsv = generateCsv(
      categoryHeaders,
      categories as unknown as Record<string, unknown>[]
    );

    const categoryFilePath = path.join(exportDir, 'categories.csv');
    fs.writeFileSync(categoryFilePath, categoryCsv, 'utf-8');
    console.log(`✓ Exported ${categories.length} Category records to: ${categoryFilePath}`);

    // 2. Export Product
    console.log('Fetching Product table...');
    const products = await prismaOld.product.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const productHeaders = [
      'id',
      'name',
      'variant',
      'family',
      'categoryId',
      'inventoryType',
      'price',
      'preparedPrice',
      'costPrice',
      'stock',
      'minStock',
      'unit',
      'iconName',
      'isActive',
      'hppNote',
      'createdAt',
      'updatedAt',
    ];

    const productCsv = generateCsv(
      productHeaders,
      products as unknown as Record<string, unknown>[]
    );

    const productFilePath = path.join(exportDir, 'products.csv');
    fs.writeFileSync(productFilePath, productCsv, 'utf-8');
    console.log(`✓ Exported ${products.length} Product records to: ${productFilePath}`);

    console.log('\n=== Export Completed Successfully ===');
    console.log(`Files saved in: ${exportDir}`);
  } catch (error) {
    console.error('❌ Export failed with error:', error);
    process.exit(1);
  } finally {
    await prismaOld.$disconnect();
  }
}

exportCatalog();

import { PrismaClient } from '@prisma/client';

async function audit() {
  const prisma = new PrismaClient();
  
  const counts = {
    Category: await prisma.category.count(),
    Product: await prisma.product.count(),
    RecipeComponent: await (prisma as any).recipeComponent?.count() || 0,
    StockAdjustmentLog: await (prisma as any).stockAdjustmentLog?.count() || 0,
    Purchase: await prisma.purchase.count(),
    PurchaseItem: await prisma.purchaseItem.count(),
    Sale: await (prisma as any).sale?.count() || 0,
    SaleItem: await (prisma as any).saleItem?.count() || 0,
    Expense: await prisma.expense.count(),
  };
  
  console.log('--- COUNTS ---');
  console.table(counts);

  console.log('--- RELATIONAL INTEGRITY ---');
  
  const orphanProducts = await prisma.product.count({
    where: { categoryId: null } as any
  }).catch(() => 'N/A');

  const orphanRecipeComponents = await (prisma as any).recipeComponent?.count({
    where: { productId: null }
  }).catch(() => 'N/A');

  const orphanPurchaseItems = await prisma.purchaseItem.findMany({
    include: { purchase: true, product: true },
  }).then(items => items.filter(i => !i.purchase || !i.product).length).catch(() => 'N/A');

  const orphanSaleItems = await (prisma as any).saleItem?.findMany({
    include: { sale: true, product: true },
  }).then((items: any[]) => items.filter((i: any) => !i.sale || !i.product).length).catch(() => 'N/A');

  const orphanStockLogs = await (prisma as any).stockAdjustmentLog?.count({
    where: { productId: null }
  }).catch(() => 'N/A');

  console.log('Product -> Category broken:', orphanProducts);
  console.log('RecipeComponent -> Product broken:', orphanRecipeComponents);
  console.log('PurchaseItem -> Purchase/Product broken:', orphanPurchaseItems);
  console.log('SaleItem -> Sale/Product broken:', orphanSaleItems);
  console.log('StockAdjustmentLog -> Product broken:', orphanStockLogs);

  await prisma.$disconnect();
}

audit();

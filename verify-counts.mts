import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const [cats, prods, purchases, purchaseItems, expenses] = await Promise.all([
  prisma.category.count(),
  prisma.product.count(),
  prisma.purchase.count(),
  prisma.purchaseItem.count(),
  prisma.expense.count(),
]);

console.log('categories    :', cats);
console.log('products      :', prods);
console.log('purchases     :', purchases);
console.log('purchaseItems :', purchaseItems);
console.log('expenses      :', expenses);

// Every purchaseItem must link to an existing purchase
const orphanItems = await prisma.purchaseItem.findMany({
  include: { purchase: true, product: true },
});
const brokenItems = orphanItems.filter(i => !i.purchase || !i.product);
console.log('broken purchaseItems:', brokenItems.length);

await prisma.$disconnect();

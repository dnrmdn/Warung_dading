import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "Sale"
    SET "paymentStatus" = 'paid',
        "amountPaid" = "totalAmount",
        "amountDue" = 0
    WHERE "paymentStatus" IS NULL OR "amountPaid" = 0;
  `);
  console.log('Backfill updated rows:', result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import {
  createSale,
  getSalesByProductId,
  getReceivableSummary,
  recordReceivablePayment,
  SalesValidationError,
} from '../lib/services/sales';

const prisma = new PrismaClient();

async function runFeatureTests() {
  console.log('=== STARTING PRODUCT HISTORY & RECEIVABLES FEATURE TESTS ===\n');

  // 1. Get an active product
  const product = await prisma.product.findFirst({
    where: { isActive: true, stock: { gte: 10 } },
  });

  if (!product) {
    throw new Error('No active product with stock >= 10 found for testing');
  }
  console.log(`Using test product: "${product.name}" (ID: ${product.id}, stock: ${product.stock})`);

  // --- Test Case 1: Create Full Payment Sale ---
  console.log('\n--- Test 1: Create Full Payment Sale ---');
  const unitPrice = product.price || 10000;
  const fullSale = await createSale({
    items: [
      {
        productId: product.id,
        quantity: 1,
        mode: 'direct',
        unitPrice,
      },
    ],
    paymentAmount: unitPrice + 5000, // overpaid with change
    customerName: 'Pelanggan Tunai',
  });

  if (
    fullSale.paymentStatus === 'paid' &&
    fullSale.amountPaid === unitPrice &&
    fullSale.amountDue === 0 &&
    fullSale.changeAmount === 5000
  ) {
    console.log('PASS: Full payment sale created correctly with paymentStatus="paid" and change=5000');
  } else {
    throw new Error(`FAIL Test 1: Unexpected fullSale state ${JSON.stringify(fullSale)}`);
  }

  // --- Test Case 2: Create Partial Payment Sale (requires customerName) ---
  console.log('\n--- Test 2: Create Partial Payment Sale (Piutang) ---');
  const partialSale = await createSale({
    items: [
      {
        productId: product.id,
        quantity: 2,
        mode: 'direct',
        unitPrice,
      },
    ],
    paymentAmount: unitPrice, // paid half
    customerName: 'Pak Budi Test',
    customerPhone: '08123456789',
  });

  const expectedTotal = unitPrice * 2;
  const expectedDue = unitPrice;
  if (
    partialSale.paymentStatus === 'partial' &&
    partialSale.amountPaid === unitPrice &&
    partialSale.amountDue === expectedDue &&
    partialSale.totalAmount === expectedTotal &&
    partialSale.customerName === 'Pak Budi Test'
  ) {
    console.log('PASS: Partial payment sale created correctly with paymentStatus="partial"');
  } else {
    throw new Error(`FAIL Test 2: Unexpected partialSale state ${JSON.stringify(partialSale)}`);
  }

  // --- Test Case 3: Validation - Unpaid Sale Without customerName Must Throw ---
  console.log('\n--- Test 3: Validation - Unpaid Sale without Customer Name ---');
  try {
    await createSale({
      items: [
        {
          productId: product.id,
          quantity: 1,
          mode: 'direct',
          unitPrice,
        },
      ],
      paymentAmount: 0,
      // No customerName!
    });
    throw new Error('FAIL: Should have thrown SalesValidationError for missing customerName');
  } catch (err) {
    if (err instanceof SalesValidationError) {
      console.log('PASS: Correctly rejected unpaid sale without customerName');
    } else {
      throw err;
    }
  }

  // --- Test Case 4: Product Sales History Query ---
  console.log('\n--- Test 4: Product Sales History Query ---');
  const history = await getSalesByProductId(product.id, 10);
  if (history.length >= 2) {
    const hasFull = history.some((h) => h.saleId === fullSale.id && h.paymentStatus === 'paid');
    const hasPartial = history.some((h) => h.saleId === partialSale.id && h.paymentStatus === 'partial');
    if (hasFull && hasPartial) {
      console.log(`PASS: getSalesByProductId retrieved history correctly with ${history.length} items`);
    } else {
      throw new Error('FAIL Test 4: Sales history missing expected test transactions');
    }
  } else {
    throw new Error(`FAIL Test 4: Expected at least 2 history items, got ${history.length}`);
  }

  // --- Test Case 5: Receivable Summary Grouping ---
  console.log('\n--- Test 5: Receivable Summary Grouping ---');
  const summary = await getReceivableSummary();
  const budiSummary = summary.find((s) => s.customerName === 'Pak Budi Test');
  if (budiSummary && budiSummary.totalDue >= expectedDue) {
    console.log(`PASS: getReceivableSummary aggregated correctly for Pak Budi Test (Total Due: ${budiSummary.totalDue})`);
  } else {
    throw new Error(`FAIL Test 5: Pak Budi Test not found in receivable summary`);
  }

  // --- Test Case 6: Settlement Payment Against Specific Sale ---
  console.log('\n--- Test 6: Settlement Payment on Outstanding Sale ---');
  const settledSale = await recordReceivablePayment({
    saleId: partialSale.id,
    amount: expectedDue,
    note: 'Pelunasan transfer test',
  });

  if (
    settledSale.paymentStatus === 'paid' &&
    settledSale.amountDue === 0 &&
    settledSale.amountPaid === expectedTotal &&
    settledSale.receivablePayments &&
    settledSale.receivablePayments.length === 1 &&
    settledSale.receivablePayments[0].amount === expectedDue
  ) {
    console.log('PASS: Specific sale successfully settled to paid with audit trail record');
  } else {
    throw new Error(`FAIL Test 6: Unexpected settled sale state ${JSON.stringify(settledSale)}`);
  }

  // --- Test Case 7: Overpayment Beyond Due Must Throw ---
  console.log('\n--- Test 7: Repayment Beyond Due Must Throw ---');
  try {
    await recordReceivablePayment({
      saleId: settledSale.id,
      amount: 1000,
    });
    throw new Error('FAIL: Should have thrown SalesValidationError for payment on already settled sale');
  } catch (err) {
    if (err instanceof SalesValidationError) {
      console.log('PASS: Correctly rejected payment on already settled sale');
    } else {
      throw err;
    }
  }

  console.log('\n=== ALL 7 FEATURE TESTS PASSED SUCCESSFULLY! ===\n');
}

runFeatureTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

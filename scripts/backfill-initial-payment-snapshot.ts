/**
 * Backfill Script: initialAmountPaid / initialAmountDue
 *
 * Populates the immutable initial payment snapshot fields for existing Sale rows
 * that were created before migration 20260915095648_add_initial_payment_snapshot.
 * After migration, new Sale rows are written with correct values by createSale().
 *
 * INVARIANT guaranteed by this script:
 *   initialAmountPaid + initialAmountDue = totalAmount  (for every row processed)
 *
 * STRATEGY:
 *   Case A — Sale has NO ReceivablePayment records:
 *     Current amountPaid/amountDue reflect the creation state exactly.
 *     → initialAmountPaid = amountPaid
 *     → initialAmountDue  = amountDue
 *
 *   Case B — Sale HAS ReceivablePayment records (later settlements occurred):
 *     Current amountPaid has been increased by settlement amounts.
 *     Reconstruct creation state by subtracting all settlement amounts.
 *     → initialAmountPaid = amountPaid - SUM(ReceivablePayment.amount)
 *     → initialAmountDue  = totalAmount - initialAmountPaid
 *
 * SAFETY:
 *   - Read-only audit runs first; backfill halts on invariant violations.
 *   - Script is idempotent: skips rows where initialAmountPaid + initialAmountDue = totalAmount already.
 *   - Never creates synthetic ReceivablePayment records.
 *   - Never modifies totalAmount, totalHpp, grossProfit, SaleItem, or stock.
 *   - Halts if derived initialAmountPaid would be negative (unresolvable reconstruction).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit(): Promise<{
  totalSales: number;
  alreadyBackfilled: number;
  needsBackfill: number;
  invariantViolations: number;
  negativeAmountPaid: number;
  negativeAmountDue: number;
}> {
  const [
    totalResult,
    alreadyResult,
    invariantResult,
    negPaidResult,
    negDueResult,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "Sale"
    `,
    // Already backfilled: initialAmountPaid + initialAmountDue = totalAmount (and not both zero unless totalAmount=0)
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "Sale"
      WHERE "initialAmountPaid" + "initialAmountDue" = "totalAmount"
    `,
    // Invariant violation: current amountPaid + amountDue != totalAmount
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "Sale"
      WHERE "amountPaid" + "amountDue" != "totalAmount"
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "Sale" WHERE "amountPaid" < 0
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "Sale" WHERE "amountDue" < 0
    `,
  ]);

  const totalSales = Number(totalResult[0].count);
  const alreadyBackfilled = Number(alreadyResult[0].count);
  const invariantViolations = Number(invariantResult[0].count);
  const negativeAmountPaid = Number(negPaidResult[0].count);
  const negativeAmountDue = Number(negDueResult[0].count);

  return {
    totalSales,
    alreadyBackfilled,
    needsBackfill: totalSales - alreadyBackfilled,
    invariantViolations,
    negativeAmountPaid,
    negativeAmountDue,
  };
}

async function main(): Promise<void> {
  console.log('=== Backfill: initialAmountPaid / initialAmountDue ===\n');

  // ── Phase 1: Pre-backfill audit ───────────────────────────────────────────
  console.log('Phase 1: Running pre-backfill audit...');
  const audit = await runAudit();

  console.log(`  Total Sales:                   ${audit.totalSales}`);
  console.log(`  Already backfilled:            ${audit.alreadyBackfilled}`);
  console.log(`  Needs backfill:                ${audit.needsBackfill}`);
  console.log(`  Invariant violations:          ${audit.invariantViolations}`);
  console.log(`  Sales with amountPaid < 0:     ${audit.negativeAmountPaid}`);
  console.log(`  Sales with amountDue  < 0:     ${audit.negativeAmountDue}`);

  if (audit.invariantViolations > 0) {
    console.error('\nSTOP: Invariant violations detected (amountPaid + amountDue != totalAmount).');
    console.error('Manual reconciliation required before backfill can proceed.');
    process.exit(1);
  }

  if (audit.negativeAmountPaid > 0 || audit.negativeAmountDue > 0) {
    console.error('\nSTOP: Negative payment amounts detected. Data integrity issue — manual review required.');
    process.exit(1);
  }

  if (audit.needsBackfill === 0) {
    console.log('\nAll rows already backfilled. Nothing to do.');
    return;
  }

  // ── Phase 2: Load all rows needing backfill ───────────────────────────────
  console.log(`\nPhase 2: Loading ${audit.needsBackfill} sales needing backfill...`);

  const salesToBackfill = await prisma.sale.findMany({
    where: {
      // Rows where snapshot invariant is not yet satisfied
      NOT: {
        // Skip rows already correctly backfilled
        // (initialAmountPaid + initialAmountDue = totalAmount already handled above)
      },
    },
    select: {
      id: true,
      totalAmount: true,
      amountPaid: true,
      amountDue: true,
      initialAmountPaid: true,
      initialAmountDue: true,
      receivablePayments: {
        select: { amount: true },
      },
    },
  });

  // Filter to only rows that actually need backfill
  const pending = salesToBackfill.filter(
    (s) => s.initialAmountPaid + s.initialAmountDue !== s.totalAmount
  );

  console.log(`  Confirmed pending rows: ${pending.length}`);

  if (pending.length === 0) {
    console.log('\nNo rows require backfill after filter. Done.');
    return;
  }

  // ── Phase 3: Derive and validate snapshot for each row ────────────────────
  console.log('\nPhase 3: Deriving initial snapshot values...');

  let updated = 0;
  const skipped = 0;
  const unresolvable: string[] = [];

  for (const sale of pending) {
    const settlementSum = sale.receivablePayments.reduce((acc, p) => acc + p.amount, 0);

    // Case B: settlements have occurred — subtract them to reconstruct creation state
    // Case A: no settlements — amountPaid/amountDue are the creation state
    const derivedInitialAmountPaid = sale.amountPaid - settlementSum;
    const derivedInitialAmountDue = sale.totalAmount - derivedInitialAmountPaid;

    // Validate derivation
    if (derivedInitialAmountPaid < 0) {
      console.error(`  UNRESOLVABLE: Sale ${sale.id} — derived initialAmountPaid=${derivedInitialAmountPaid} is negative.`);
      unresolvable.push(sale.id);
      continue;
    }

    if (derivedInitialAmountDue < 0) {
      console.error(`  UNRESOLVABLE: Sale ${sale.id} — derived initialAmountDue=${derivedInitialAmountDue} is negative.`);
      unresolvable.push(sale.id);
      continue;
    }

    if (derivedInitialAmountPaid + derivedInitialAmountDue !== sale.totalAmount) {
      console.error(`  UNRESOLVABLE: Sale ${sale.id} — invariant check failed after derivation.`);
      unresolvable.push(sale.id);
      continue;
    }

    // Write the snapshot — only these two fields, nothing else
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        initialAmountPaid: derivedInitialAmountPaid,
        initialAmountDue: derivedInitialAmountDue,
      },
    });

    console.log(
      `  Updated: ${sale.id.slice(0, 8)}... ` +
      `totalAmount=${sale.totalAmount} ` +
      `initialAmountPaid=${derivedInitialAmountPaid} ` +
      `initialAmountDue=${derivedInitialAmountDue} ` +
      `(settlements=${settlementSum})`
    );
    updated++;
  }

  // ── Phase 4: Report outcome ───────────────────────────────────────────────
  console.log(`\nPhase 4: Backfill complete.`);
  console.log(`  Updated:     ${updated}`);
  console.log(`  Skipped:     ${skipped}`);
  console.log(`  Unresolvable: ${unresolvable.length}`);

  if (unresolvable.length > 0) {
    console.error('\nWARN: The following Sale IDs could not be backfilled and require manual reconciliation:');
    for (const id of unresolvable) {
      console.error(`  ${id}`);
    }
    process.exit(1);
  }

  // ── Phase 5: Post-backfill invariant verification ─────────────────────────
  console.log('\nPhase 5: Verifying post-backfill invariant...');

  const postViolations = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM "Sale"
    WHERE "initialAmountPaid" + "initialAmountDue" != "totalAmount"
  `;
  const violations = Number(postViolations[0].count);

  if (violations > 0) {
    console.error(`\nSTOP: ${violations} rows still violate the invariant after backfill. Manual review required.`);
    process.exit(1);
  }

  console.log('  POST-BACKFILL INVARIANT: PASS — initialAmountPaid + initialAmountDue = totalAmount for all rows.');
  console.log('\n=== Backfill completed successfully. ===');
}

main()
  .catch((e) => {
    console.error('Fatal error during backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

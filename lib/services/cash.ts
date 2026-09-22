import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  DailyCashBalance,
  SetOpeningCashInput,
  TodayCashPosition,
} from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class CashValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CashValidationError';
  }
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getTodayLocalDate(date = new Date()): string {
  return JAKARTA_DATE_FORMATTER.format(date);
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

// ─── Type Converters / Mappers ───────────────────────────────────────────────

function toDomainDailyCashBalance(
  row: Prisma.DailyCashBalanceGetPayload<Record<string, never>>
): DailyCashBalance {
  return {
    id: row.id,
    date: formatDateToIsoDate(row.date),
    openingCash: row.openingCash,
    openingNote: row.openingNote ?? undefined,
    openedByUserId: row.openedByUserId ?? undefined,
    closingCash: row.closingCash ?? undefined,
    closingNote: row.closingNote ?? undefined,
    closedAt: row.closedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Query Operations ────────────────────────────────────────────────────────

/**
 * Retrieves the DailyCashBalance record for a given date string (YYYY-MM-DD).
 * Defaults to today's Jakarta local date if not specified.
 */
export async function getDailyCashBalance(
  dateStr?: string
): Promise<DailyCashBalance | null> {
  const targetDateStr = dateStr ?? getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    throw new CashValidationError('Format tanggal harus YYYY-MM-DD');
  }

  const parsedDate = parseDateToUtcMidnight(targetDateStr);

  const record = await prisma.dailyCashBalance.findUnique({
    where: { date: parsedDate },
  });

  return record ? toDomainDailyCashBalance(record) : null;
}

/**
 * Computes today's live cash position for the drawer:
 * Expected Cash = Opening Cash + Cash In (POS + Settlements) - Cash Out (Expenses).
 * Efficiently aggregates everything in a single parallel database wave.
 */
export async function getTodayCashPosition(
  dateStr?: string
): Promise<TodayCashPosition> {
  const targetDateStr = dateStr ?? getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    throw new CashValidationError('Format tanggal harus YYYY-MM-DD');
  }

  const parsedDate = parseDateToUtcMidnight(targetDateStr);
  const nextDayMidnight = new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000);

  // Single coordinated parallel wave:
  // 1. DailyCashBalance for the target date
  // 2. Sum of Sale.initialAmountPaid for transactions on the target date
  // 3. Sum of ReceivablePayment.amount for payments made during the target date
  // 4. Sum of Expense.amount for expenses on the target date
  const [cashBalanceRecord, posSalesAggregate, settlementAggregate, expenseAggregate] =
    await Promise.all([
      prisma.dailyCashBalance.findUnique({
        where: { date: parsedDate },
      }),
      prisma.sale.aggregate({
        where: { transactionDate: parsedDate },
        _sum: {
          initialAmountPaid: true, // Cash physically retained in drawer at checkout
        },
      }),
      prisma.receivablePayment.aggregate({
        where: {
          paidAt: {
            gte: parsedDate,
            lt: nextDayMidnight,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.expense.aggregate({
        where: { expenseDate: parsedDate },
        _sum: {
          amount: true,
        },
      }),
    ]);

  const posCashIn = posSalesAggregate._sum.initialAmountPaid ?? 0;
  const receivableCashIn = settlementAggregate._sum.amount ?? 0;
  const cashIn = posCashIn + receivableCashIn;
  const expenseCashOut = expenseAggregate._sum.amount ?? 0;
  const cashOut = expenseCashOut;

  const isInitialized = cashBalanceRecord !== null;
  const openingCash = cashBalanceRecord ? cashBalanceRecord.openingCash : 0;
  const expectedCash = isInitialized ? openingCash + cashIn - cashOut : cashIn - cashOut;

  return {
    date: targetDateStr,
    isInitialized,
    openingCash,
    openingNote: cashBalanceRecord?.openingNote ?? undefined,
    cashIn,
    cashOut,
    expectedCash,
    closingCash: cashBalanceRecord?.closingCash,
    closedAt: cashBalanceRecord?.closedAt?.toISOString(),
    posCashIn,
    receivableCashIn,
    expenseCashOut,
  };
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

/**
 * Sets or updates the opening cash balance for a given date.
 * Enforces:
 * 1. openingCash must be an integer >= 0.
 * 2. If already closed (closingCash != null), modification is forbidden.
 * 3. Safe against duplicate creation / race conditions via atomic upsert.
 */
export async function setOpeningCash(
  input: SetOpeningCashInput,
  userId?: string
): Promise<DailyCashBalance> {
  const { openingCash, openingNote } = input;

  if (
    typeof openingCash !== 'number' ||
    !Number.isFinite(openingCash) ||
    !Number.isInteger(openingCash) ||
    openingCash < 0
  ) {
    throw new CashValidationError(
      'Saldo awal kas harus berupa bilangan bulat positif atau 0 (Rupiah).'
    );
  }

  const dateStr = input.date?.trim() || getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new CashValidationError('Format tanggal harus YYYY-MM-DD.');
  }

  const parsedDate = parseDateToUtcMidnight(dateStr);
  const sanitizedNote = openingNote?.trim() || null;

  // Check if existing record is already closed
  const existing = await prisma.dailyCashBalance.findUnique({
    where: { date: parsedDate },
  });

  if (existing && existing.closingCash !== null) {
    throw new CashValidationError(
      'Kasir untuk tanggal ini sudah ditutup dan saldo awal tidak dapat diubah lagi.'
    );
  }

  const upserted = await prisma.dailyCashBalance.upsert({
    where: { date: parsedDate },
    create: {
      date: parsedDate,
      openingCash,
      openingNote: sanitizedNote,
      openedByUserId: userId ?? null,
    },
    update: {
      openingCash,
      openingNote: sanitizedNote,
      // preserve existing openedByUserId if already set, or record if new
      ...(userId ? { openedByUserId: userId } : {}),
    },
  });

  return toDomainDailyCashBalance(upserted);
}

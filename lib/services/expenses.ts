import 'server-only';

import { prisma } from '@/lib/prisma';
import { Expense, ExpenseCategory } from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class ExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpenseValidationError';
  }
}

// ─── Valid Category Literals ─────────────────────────────────────────────────

const VALID_EXPENSE_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set<ExpenseCategory>([
  'operasional',
  'bahan_baku',
  'transportasi',
  'gaji',
  'peralatan',
  'lainnya',
]);

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateExpenseInput {
  expenseDate?: string; // Optional 'YYYY-MM-DD', defaults to local business date
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

export interface GetExpensesFilter {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  limit?: number;
}

// ─── Type Converters / Mappers ───────────────────────────────────────────────

function toDomainExpense(e: Prisma.ExpenseGetPayload<{}>): Expense {
  return {
    id: e.id,
    expenseDate: formatDateToIsoDate(e.expenseDate),
    category: e.category as ExpenseCategory,
    amount: e.amount,
    description: e.description ?? undefined,
    createdAt: e.createdAt.toISOString(),
  };
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// ─── Query Operations ────────────────────────────────────────────────────────

/**
 * Retrieves all expenses, optionally filtered by date range and limit.
 * Ordered by expenseDate descending, then createdAt descending.
 */
export async function getExpenses(filter?: GetExpensesFilter): Promise<Expense[]> {
  const where: Prisma.ExpenseWhereInput = {};

  if (filter?.startDate || filter?.endDate) {
    where.expenseDate = {};
    if (filter.startDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate)) {
        throw new ExpenseValidationError('Format startDate harus YYYY-MM-DD');
      }
      where.expenseDate.gte = parseDateToUtcMidnight(filter.startDate);
    }
    if (filter.endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) {
        throw new ExpenseValidationError('Format endDate harus YYYY-MM-DD');
      }
      where.expenseDate.lte = parseDateToUtcMidnight(filter.endDate);
    }
  }

  if (filter?.limit !== undefined) {
    if (typeof filter.limit !== 'number' || !Number.isInteger(filter.limit) || filter.limit <= 0) {
      throw new ExpenseValidationError('Limit harus berupa bilangan bulat positif.');
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [
      { expenseDate: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filter?.limit,
  });

  return expenses.map(toDomainExpense);
}

/**
 * Retrieves a single expense by ID. Returns null if not found.
 */
export async function getExpenseById(id: string): Promise<Expense | null> {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  return expense ? toDomainExpense(expense) : null;
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

/**
 * Creates a new expense record with direct single-row Prisma persistence.
 */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  // 1. Validate Category
  if (!VALID_EXPENSE_CATEGORIES.has(input.category)) {
    throw new ExpenseValidationError(
      `Kategori pengeluaran tidak valid: "${String(input.category)}".`
    );
  }

  // 2. Validate Amount (positive integer, non-zero, non-negative, finite)
  if (
    typeof input.amount !== 'number' ||
    !Number.isFinite(input.amount) ||
    !Number.isInteger(input.amount) ||
    input.amount <= 0
  ) {
    throw new ExpenseValidationError('Jumlah pengeluaran harus berupa bilangan bulat positif.');
  }

  // 3. Validate / Determine Date
  const expenseDateStr = input.expenseDate?.trim() || getTodayLocalDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDateStr)) {
    throw new ExpenseValidationError('Format expenseDate harus YYYY-MM-DD.');
  }

  const parsedExpenseDate = parseDateToUtcMidnight(expenseDateStr);

  // 4. Sanitize Description
  const sanitizedDescription = input.description?.trim() || null;

  // 5. Persist single row
  const created = await prisma.expense.create({
    data: {
      expenseDate: parsedExpenseDate,
      category: input.category,
      amount: input.amount,
      description: sanitizedDescription,
    },
  });

  return toDomainExpense(created);
}

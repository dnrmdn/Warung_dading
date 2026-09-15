'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  CreateExpenseInput,
  GetExpensesFilter,
  ExpenseValidationError,
} from '@/lib/services/expenses';
import { Expense } from '@/types/warung';

function handleExpenseError(error: unknown): ActionResult<never> {
  if (error instanceof ExpenseValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    };
  }

  console.error('[Expense Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    },
  };
}

export async function getExpensesAction(
  filter?: GetExpensesFilter
): Promise<ActionResult<Expense[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getExpenses(filter);
    return { success: true, data };
  } catch (error) {
    return handleExpenseError(error);
  }
}

export async function getExpenseByIdAction(
  id: string
): Promise<ActionResult<Expense | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getExpenseById(id);
    return { success: true, data };
  } catch (error) {
    return handleExpenseError(error);
  }
}

export async function createExpenseAction(
  input: CreateExpenseInput
): Promise<ActionResult<Expense>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await createExpense(input);
    revalidatePath('/pengeluaran');
    revalidatePath('/');
    revalidatePath('/laporan');
    return { success: true, data };
  } catch (error) {
    return handleExpenseError(error);
  }
}

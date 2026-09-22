'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getDailyCashBalance,
  getTodayCashPosition,
  setOpeningCash,
  CashValidationError,
} from '@/lib/services/cash';
import {
  DailyCashBalance,
  SetOpeningCashInput,
  TodayCashPosition,
} from '@/types/warung';

function handleCashError(error: unknown): ActionResult<never> {
  if (error instanceof CashValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    };
  }

  console.error('[Cash Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem pada data kas. Silakan coba lagi.',
    },
  };
}

export async function getDailyCashBalanceAction(
  dateStr?: string
): Promise<ActionResult<DailyCashBalance | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getDailyCashBalance(dateStr);
    return { success: true, data };
  } catch (error) {
    return handleCashError(error);
  }
}

export async function getTodayCashPositionAction(
  dateStr?: string
): Promise<ActionResult<TodayCashPosition>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getTodayCashPosition(dateStr);
    return { success: true, data };
  } catch (error) {
    return handleCashError(error);
  }
}

export async function setOpeningCashAction(
  input: SetOpeningCashInput
): Promise<ActionResult<DailyCashBalance>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const userId = authCheck.user.id;
    const data = await setOpeningCash(input, userId);
    revalidatePath('/');
    revalidatePath('/jual');
    revalidatePath('/laporan');
    revalidatePath('/more');
    return { success: true, data };
  } catch (error) {
    return handleCashError(error);
  }
}

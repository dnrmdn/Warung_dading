'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  CreatePurchaseInput,
  GetPurchasesFilter,
  PurchaseValidationError,
  ProductNotFoundError,
} from '@/lib/services/purchases';
import { Purchase } from '@/types/warung';

function handlePurchaseError(error: unknown): ActionResult<never> {
  if (error instanceof PurchaseValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    };
  }

  if (error instanceof ProductNotFoundError) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    };
  }

  console.error('[Purchase Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    },
  };
}

export async function getPurchasesAction(
  filter?: GetPurchasesFilter
): Promise<ActionResult<Purchase[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getPurchases(filter);
    return { success: true, data };
  } catch (error) {
    return handlePurchaseError(error);
  }
}

export async function getPurchaseByIdAction(
  id: string
): Promise<ActionResult<Purchase | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getPurchaseById(id);
    return { success: true, data };
  } catch (error) {
    return handlePurchaseError(error);
  }
}

export async function createPurchaseAction(
  input: CreatePurchaseInput
): Promise<ActionResult<Purchase>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await createPurchase(input);
    revalidatePath('/pembelian');
    revalidatePath('/supplier');
    revalidatePath('/');
    revalidatePath('/laporan');
    return { success: true, data };
  } catch (error) {
    return handlePurchaseError(error);
  }
}

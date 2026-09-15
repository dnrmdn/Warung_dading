'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getSales,
  getSaleById,
  createSale,
  getSalesByProductId,
  getReceivableSummary,
  recordReceivablePayment,
  CreateSaleInput,
  RecordReceivablePaymentInput,
  GetSalesFilter,
  SalesValidationError,
  ProductNotFoundError,
  InsufficientStockError,
  TransactionCollisionError,
} from '@/lib/services/sales';
import { Sale, ProductSaleHistoryItem, ReceivableSummary } from '@/types/warung';

function handleSaleError(error: unknown): ActionResult<never> {
  if (error instanceof SalesValidationError) {
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

  if (error instanceof InsufficientStockError) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_STOCK',
        message: error.message,
      },
    };
  }

  if (error instanceof TransactionCollisionError) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message: error.message,
      },
    };
  }

  console.error('[Sales Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    },
  };
}

export async function getSalesAction(
  filter?: GetSalesFilter
): Promise<ActionResult<Sale[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getSales(filter);
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

export async function getSaleByIdAction(
  id: string
): Promise<ActionResult<Sale | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getSaleById(id);
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

export async function createSaleAction(
  input: CreateSaleInput
): Promise<ActionResult<Sale>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await createSale(input);
    revalidatePath('/');
    revalidatePath('/laporan');
    revalidatePath('/piutang');
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

export async function getSalesByProductIdAction(
  productId: string,
  limit?: number
): Promise<ActionResult<ProductSaleHistoryItem[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getSalesByProductId(productId, limit);
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

export async function getReceivableSummaryAction(): Promise<ActionResult<ReceivableSummary[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getReceivableSummary();
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

export async function recordReceivablePaymentAction(
  input: RecordReceivablePaymentInput
): Promise<ActionResult<Sale>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await recordReceivablePayment(input);
    revalidatePath('/piutang');
    revalidatePath('/');
    revalidatePath('/laporan');
    return { success: true, data };
  } catch (error) {
    return handleSaleError(error);
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  toggleSupplierActive,
  GetSuppliersFilter,
  SupplierValidationError,
  SupplierNotFoundError,
  SupplierDuplicateError,
} from '@/lib/services/suppliers';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@/types/warung';

function handleSupplierError(error: unknown): ActionResult<never> {
  if (error instanceof SupplierValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    };
  }

  if (error instanceof SupplierNotFoundError) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    };
  }

  if (error instanceof SupplierDuplicateError) {
    return {
      success: false,
      error: {
        code: 'DUPLICATE',
        message: error.message,
      },
    };
  }

  console.error('[Supplier Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    },
  };
}

export async function getSuppliersAction(
  filter?: GetSuppliersFilter
): Promise<ActionResult<Supplier[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getSuppliers(filter);
    return { success: true, data };
  } catch (error) {
    return handleSupplierError(error);
  }
}

export async function getSupplierByIdAction(
  id: string
): Promise<ActionResult<Supplier | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getSupplierById(id);
    return { success: true, data };
  } catch (error) {
    return handleSupplierError(error);
  }
}

export async function createSupplierAction(
  input: CreateSupplierInput
): Promise<ActionResult<Supplier>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await createSupplier(input);
    revalidatePath('/supplier');
    revalidatePath('/pembelian/baru');
    return { success: true, data };
  } catch (error) {
    return handleSupplierError(error);
  }
}

export async function updateSupplierAction(
  id: string,
  input: UpdateSupplierInput
): Promise<ActionResult<Supplier>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await updateSupplier(id, input);
    revalidatePath('/supplier');
    revalidatePath('/pembelian/baru');
    return { success: true, data };
  } catch (error) {
    return handleSupplierError(error);
  }
}

export async function toggleSupplierActiveAction(
  id: string
): Promise<ActionResult<Supplier>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await toggleSupplierActive(id);
    revalidatePath('/supplier');
    revalidatePath('/pembelian/baru');
    return { success: true, data };
  } catch (error) {
    return handleSupplierError(error);
  }
}

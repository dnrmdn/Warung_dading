'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import {
  getCategories,
  getProducts,
  getProductById,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecipeComponents,
  adjustStock,
} from '@/lib/services/products';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  HPPComponent,
  AdjustStockInput,
  StockAdjustmentLog,
} from '@/types/warung';

function handleProductError(error: unknown): ActionResult<never> {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('tidak ditemukan')) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: msg,
        },
      };
    }
    if (
      msg.includes('wajib diisi') ||
      msg.includes('harus berupa') ||
      msg.includes('tidak valid') ||
      msg.includes('tidak mencukupi')
    ) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: msg,
        },
      };
    }
  }

  console.error('[Product Action Error]:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    },
  };
}

export async function getCategoriesAction(): Promise<ActionResult<string[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getCategories();
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function getProductsAction(options?: {
  includeInactive?: boolean;
}): Promise<ActionResult<Product[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getProducts(options);
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function getProductByIdAction(
  id: string
): Promise<ActionResult<Product | null>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getProductById(id);
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function getLowStockProductsAction(): Promise<ActionResult<Product[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getLowStockProducts();
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function createProductAction(
  input: CreateProductInput
): Promise<ActionResult<Product>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await createProduct(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput
): Promise<ActionResult<Product>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await updateProduct(id, input);
    revalidatePath('/');
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<Product>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    await deleteProduct(id);
    const product = await getProductById(id);
    if (!product) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Produk dengan ID "${id}" tidak ditemukan.`,
        },
      };
    }
    revalidatePath('/');
    return { success: true, data: product };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function getRecipeComponentsAction(
  productId: string
): Promise<ActionResult<HPPComponent[]>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const data = await getRecipeComponents(productId);
    return { success: true, data };
  } catch (error) {
    return handleProductError(error);
  }
}

export async function adjustStockAction(
  input: AdjustStockInput
): Promise<ActionResult<{ product: Product; log: StockAdjustmentLog }>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const log = await adjustStock(input);
    const product = await getProductById(input.productId);
    if (!product) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Produk dengan ID "${input.productId}" tidak ditemukan.`,
        },
      };
    }
    revalidatePath('/');
    return {
      success: true,
      data: {
        product,
        log,
      },
    };
  } catch (error) {
    return handleProductError(error);
  }
}

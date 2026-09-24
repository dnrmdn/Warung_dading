'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guard';
import { ActionResult } from '@/app/actions/types';
import { prisma } from '@/lib/prisma';
import {
  uploadProductImage,
  deleteProductImage,
  deleteAllProductImages,
} from '@/lib/supabase-storage';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Server-side max processed file size (1 MB). Client compresses before upload. */
const MAX_UPLOAD_SIZE = 1 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Upload Product Image ───────────────────────────────────────────────────

/**
 * Uploads a product image to Supabase Storage and updates the product record.
 *
 * Flow:
 * 1. Validate auth (admin required)
 * 2. Validate the uploaded file (type, size)
 * 3. If product already has an image, delete the old one
 * 4. Upload new image to Supabase Storage
 * 5. Update Product.imageUrl in the database
 * 6. Revalidate affected pages
 *
 * @param productId - The product to attach the image to
 * @param formData - FormData containing a 'file' field with the compressed image
 * @returns The new public image URL
 */
export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ imageUrl: string }>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    // 1. Extract file from FormData
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File gambar tidak ditemukan.',
        },
      };
    }

    // 2. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
        },
      };
    }

    // 3. Validate file size (server-side ceiling)
    if (file.size > MAX_UPLOAD_SIZE) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ukuran file terlalu besar. Maksimal 1 MB setelah kompresi.',
        },
      };
    }

    // 4. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, imageUrl: true },
    });

    if (!product) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Produk dengan ID "${productId}" tidak ditemukan.`,
        },
      };
    }

    const oldImageUrl = product.imageUrl;

    // 5. Read file data and upload NEW image first
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const newImageUrl = await uploadProductImage(productId, buffer, file.type);

    // 6. Update database to point to the new image
    try {
      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: newImageUrl },
      });
    } catch (dbError) {
      // DB update failed: attempt cleanup of newly uploaded image to prevent orphan
      try {
        await deleteProductImage(newImageUrl, productId);
      } catch (cleanupError) {
        console.error(
          '[uploadProductImageAction] Failed to cleanup new image after DB error:',
          cleanupError
        );
      }
      throw dbError;
    }

    // 7. Delete OLD image only after DB successfully points to new image
    if (oldImageUrl) {
      try {
        await deleteProductImage(oldImageUrl, productId);
      } catch (cleanupError) {
        // Log cleanup failure; do NOT revert DB or delete new image
        console.error(
          '[uploadProductImageAction] Failed to delete old image after successful replacement:',
          cleanupError
        );
      }
    }

    // 8. Revalidate
    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true, data: { imageUrl: newImageUrl } };
  } catch (error) {
    console.error('[uploadProductImageAction] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Gagal mengunggah gambar.';
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    };
  }
}

// ─── Remove Product Image ───────────────────────────────────────────────────

/**
 * Removes a product's image from the database first, then deletes from Supabase Storage.
 *
 * @param productId - The product whose image should be removed
 */
export async function removeProductImageAction(
  productId: string
): Promise<ActionResult<{ success: true }>> {
  const authCheck = await requireAdmin();
  if (!authCheck.success) return authCheck.errorResult;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, imageUrl: true },
    });

    if (!product) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Produk dengan ID "${productId}" tidak ditemukan.`,
        },
      };
    }

    const oldImageUrl = product.imageUrl;

    // 1. Update database to null first
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: null },
    });

    // 2. Delete storage image(s) only after database update succeeds
    if (oldImageUrl) {
      try {
        await deleteAllProductImages(productId);
      } catch (cleanupError) {
        // Log cleanup failure; do NOT revert database
        console.error(
          '[removeProductImageAction] Failed to delete storage files:',
          cleanupError
        );
      }
    }

    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('[removeProductImageAction] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Gagal menghapus gambar.';
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    };
  }
}

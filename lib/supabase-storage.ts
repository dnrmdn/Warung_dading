import 'server-only';

import { createClient } from '@supabase/supabase-js';

// ─── Configuration ──────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * The Supabase Storage bucket name for product images.
 * This bucket must be created in the Supabase dashboard with "Public" access.
 *
 * Setup instructions:
 * 1. Go to Supabase Dashboard → Storage → New Bucket
 * 2. Name: "product-images"
 * 3. Public bucket: ON
 * 4. File size limit: 1MB (generous ceiling; the app enforces 512KB pre-upload)
 * 5. Allowed MIME types: image/jpeg, image/png, image/webp
 */
const BUCKET_NAME = 'product-images';

// ─── Supabase Admin Client (Server-Only) ────────────────────────────────────

/**
 * Creates a Supabase admin client using the service role key.
 * This client bypasses Row Level Security and is ONLY used server-side
 * for storage operations (upload, delete).
 *
 * @throws Error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not configured.
 */
function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it in your .env file.'
    );
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Please configure it in your .env file.'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── Storage Operations ─────────────────────────────────────────────────────

/**
 * Uploads a product image to Supabase Storage.
 *
 * File path structure: `products/{productId}/{uuid}.webp`
 *
 * @param productId - The product ID to associate the image with
 * @param fileBuffer - The processed image data as a Buffer or Uint8Array
 * @param contentType - The MIME type (e.g., 'image/webp', 'image/jpeg')
 * @returns The public URL of the uploaded image
 * @throws Error if upload fails
 */
export async function uploadProductImage(
  productId: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseAdmin();

  // Determine file extension from content type
  const ext = contentType === 'image/webp' ? 'webp'
    : contentType === 'image/png' ? 'png'
    : 'jpg';

  // Generate unique file path: products/{productId}/{uuid}.{ext}
  const uuid = crypto.randomUUID();
  const filePath = `products/${productId}/${uuid}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      cacheControl: '31536000', // 1 year — images are immutable (new upload = new path)
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    throw new Error(`Gagal mengunggah gambar produk: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Deletes a product image from Supabase Storage.
 *
 * Extracts the file path from the full public URL and removes it from the bucket.
 * Silently succeeds if the file doesn't exist (idempotent).
 *
 * @param imageUrl - The full public URL of the image to delete
 */
export async function deleteProductImage(
  imageUrl: string,
  expectedProductId?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Extract file path from the public URL
  // URL format: https://{ref}.supabase.co/storage/v1/object/public/product-images/{path}
  const bucketPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const urlObj = new URL(imageUrl);
  const pathStart = urlObj.pathname.indexOf(bucketPrefix);

  if (pathStart === -1) {
    console.warn('[Supabase Storage] Could not extract path from URL:', imageUrl);
    return;
  }

  const filePath = urlObj.pathname.slice(pathStart + bucketPrefix.length);

  // Validate that the path is scoped to the expected product ID if provided
  if (expectedProductId && !filePath.startsWith(`products/${expectedProductId}/`)) {
    console.warn(
      '[Supabase Storage] Path does not match expected product ID:',
      filePath,
      expectedProductId
    );
    return;
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    // Log but don't throw — deletion failure shouldn't block product updates
    console.error('[Supabase Storage] Delete error:', error);
  }
}

/**
 * Deletes ALL images for a specific product from Supabase Storage.
 * Used during product image replacement to clean up old files.
 *
 * @param productId - The product ID whose images should be removed
 */
export async function deleteAllProductImages(productId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // List all files in the product's folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`products/${productId}`);

  if (listError) {
    console.error('[Supabase Storage] List error:', listError);
    return;
  }

  if (!files || files.length === 0) return;

  const filePaths = files.map((f) => `products/${productId}/${f.name}`);

  const { error: removeError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (removeError) {
    console.error('[Supabase Storage] Bulk delete error:', removeError);
  }
}

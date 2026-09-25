/**
 * Client-side image compression and resizing utility.
 *
 * Uses the browser Canvas API to resize and compress images before upload,
 * eliminating the need for server-side native binaries (like `sharp`) which
 * are incompatible with Vercel's Edge/Serverless runtime.
 *
 * Target output: ≤512×512px WebP (with aspect-ratio preservation).
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum width or height in pixels for the output image. */
const MAX_DIMENSION = 512;

/** WebP compression quality (0–1). 0.82 provides good quality/size balance. */
const WEBP_QUALITY = 0.82;

/** Maximum allowed file size for the original selected file (512 KB). */
export const MAX_FILE_SIZE_BYTES = 512 * 1024;

/** Accepted MIME types for product image uploads. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** File input accept attribute string. */
export const IMAGE_ACCEPT_STRING = ACCEPTED_IMAGE_TYPES.join(',');

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validates a File object before processing.
 * @returns An error message string if invalid, or `null` if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
    return 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeKB = Math.round(file.size / 1024);
    return `Ukuran file terlalu besar (${sizeKB} KB). Maksimal 512 KB.`;
  }

  return null;
}

// ─── Compression ────────────────────────────────────────────────────────────

/**
 * Compresses and resizes an image file using the browser Canvas API.
 *
 * 1. Loads the file into an HTMLImageElement.
 * 2. Calculates new dimensions (max 512×512, preserving aspect ratio).
 * 3. Draws onto an OffscreenCanvas (or regular Canvas).
 * 4. Exports as WebP blob at 82% quality.
 *
 * @param file - The original image File from a file input.
 * @returns A compressed WebP Blob ready for upload.
 * @throws Error if the image cannot be loaded or processed.
 */
export async function compressImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);

  const { width: origW, height: origH } = imageBitmap;

  // Calculate new dimensions preserving aspect ratio
  let newW = origW;
  let newH = origH;

  if (origW > MAX_DIMENSION || origH > MAX_DIMENSION) {
    if (origW >= origH) {
      newW = MAX_DIMENSION;
      newH = Math.round((origH / origW) * MAX_DIMENSION);
    } else {
      newH = MAX_DIMENSION;
      newW = Math.round((origW / origH) * MAX_DIMENSION);
    }
  }

  // Use OffscreenCanvas if available, fall back to regular canvas
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal membuat konteks Canvas.');
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);
    imageBitmap.close();
    return canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
  }

  // Fallback for browsers without OffscreenCanvas
  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gagal membuat konteks Canvas.');
  ctx.drawImage(imageBitmap, 0, 0, newW, newH);
  imageBitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengompres gambar.'));
      },
      'image/webp',
      WEBP_QUALITY
    );
  });
}

/**
 * Crops and compresses an image to a 1:1 WebP blob (max 512x512px).
 *
 * @param imageElement - Loaded HTMLImageElement or ImageBitmap.
 * @param cropArea - The source coordinates (sx, sy, sWidth, sHeight) from the original image.
 * @returns A compressed WebP Blob ready for upload.
 */
export async function cropAndCompressToWebP(
  imageElement: CanvasImageSource,
  cropArea: { sx: number; sy: number; sWidth: number; sHeight: number }
): Promise<Blob> {
  const targetSize = Math.min(MAX_DIMENSION, Math.round(cropArea.sWidth));
  const outputSize = Math.max(64, Math.min(MAX_DIMENSION, targetSize));

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(outputSize, outputSize);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal membuat konteks Canvas.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      imageElement,
      cropArea.sx,
      cropArea.sy,
      cropArea.sWidth,
      cropArea.sHeight,
      0,
      0,
      outputSize,
      outputSize
    );
    return canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
  }

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gagal membuat konteks Canvas.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    imageElement,
    cropArea.sx,
    cropArea.sy,
    cropArea.sWidth,
    cropArea.sHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengompres gambar hasil crop.'));
      },
      'image/webp',
      WEBP_QUALITY
    );
  });
}

/**
 * Creates a local preview URL for a File or Blob.
 * Remember to call URL.revokeObjectURL() when done.
 */
export function createPreviewUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Product } from '@/types/warung';
import { createProductAction, updateProductAction } from '@/app/actions/products';
import { uploadProductImageAction, removeProductImageAction } from '@/app/actions/product-image';
import { ProductIcon } from '@/components/ui/product-icon';
import { AlertCircle, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import {
  validateImageFile,
  compressImage,
  createPreviewUrl,
  IMAGE_ACCEPT_STRING,
} from '@/lib/image-compression';

interface ProductFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  product?: Product | null;
  categories: string[];
  onSuccess: () => void;
  onAdjustStock?: (product: Product) => void;
}

const AVAILABLE_ICONS = [
  'Package',
  'CupSoda',
  'Coffee',
  'Soup',
  'Cookie',
  'Egg',
  'Flame',
  'Wheat',
  'Layers',
];

export function ProductFormSheet({
  isOpen,
  onClose,
  mode,
  product,
  categories,
  onSuccess,
  onAdjustStock,
}: ProductFormSheetProps) {
  // Form states
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [family, setFamily] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [preparedPrice, setPreparedPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('0');
  const [unit, setUnit] = useState('pcs');
  const [iconName, setIconName] = useState('Package');
  const [isActive, setIsActive] = useState(true);

  // Image states
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize state when opening / switching modes / products
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setIsSubmitting(false);
      setIsUploadingImage(false);
      setCompressedFile(null);
      setImageRemoved(false);
      // Clean up any existing object URL
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);

      if (mode === 'edit' && product) {
        setName(product.name || '');
        setVariant(product.variant || '');
        setFamily(product.family || '');
        setCategory(product.category || '');
        setPrice(product.price !== undefined ? String(product.price) : '');
        setPreparedPrice(
          product.preparedPrice !== undefined ? String(product.preparedPrice) : ''
        );
        setCostPrice(
          product.costPrice !== undefined ? String(product.costPrice) : ''
        );
        // Note: stock is not edited in 'edit' mode, but displayed for reference
        setStock(String(product.stock ?? 0));
        setMinStock(String(product.minStock ?? 0));
        setUnit(product.unit || 'pcs');
        setIconName(product.iconName || 'Package');
        setIsActive(product.isActive ?? true);
        setExistingImageUrl(product.imageUrl || null);
      } else {
        // Defaults for create
        setName('');
        setVariant('');
        setFamily('');
        setCategory('');
        setPrice('');
        setPreparedPrice('');
        setCostPrice('');
        setStock('0');
        setMinStock('0');
        setUnit('pcs');
        setIconName('Package');
        setIsActive(true);
        setExistingImageUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, product]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Image Handlers ─────────────────────────────────────────────────

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Validate
    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, image: validationError }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    try {
      // Compress image client-side
      const compressed = await compressImage(file);
      setCompressedFile(compressed);

      // Create preview URL
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const preview = createPreviewUrl(compressed);
      setImagePreviewUrl(preview);
      setImageRemoved(false);

      // In edit mode with existing product, upload immediately
      if (mode === 'edit' && product) {
        setIsUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append('file', compressed, 'product-image.webp');
          const result = await uploadProductImageAction(product.id, formData);
          if (result.success) {
            setExistingImageUrl(result.data.imageUrl);
          } else {
            // Upload failed: show error and revert local blob preview
            setErrors((prev) => ({ ...prev, image: result.error.message }));
            if (preview.startsWith('blob:')) {
              URL.revokeObjectURL(preview);
            }
            setImagePreviewUrl(null);
            setCompressedFile(null);
          }
        } catch {
          // Upload exception: show error and revert local blob preview
          setErrors((prev) => ({ ...prev, image: 'Gagal mengunggah gambar.' }));
          if (preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
          }
          setImagePreviewUrl(null);
          setCompressedFile(null);
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch {
      setErrors((prev) => ({ ...prev, image: 'Gagal memproses gambar.' }));
    }
  };

  const handleImageRemove = async () => {
    // In edit mode with existing persisted image, remove from storage via server action
    if (mode === 'edit' && product && existingImageUrl) {
      setIsUploadingImage(true);
      try {
        const result = await removeProductImageAction(product.id);
        if (result.success) {
          if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreviewUrl);
          }
          setImagePreviewUrl(null);
          setCompressedFile(null);
          setExistingImageUrl(null);
          setImageRemoved(true);
        } else {
          setErrors((prev) => ({ ...prev, image: result.error.message }));
          // Do NOT call setImageRemoved(true); keep existing image visible
        }
      } catch {
        setErrors((prev) => ({ ...prev, image: 'Gagal menghapus gambar.' }));
        // Do NOT call setImageRemoved(true); keep existing image visible
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      // In create mode or when there is only a local un-uploaded preview
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
      setCompressedFile(null);
      setImageRemoved(true);
    }
  };

  // Determine what image to display
  const displayImageUrl = imagePreviewUrl || (!imageRemoved ? existingImageUrl : null);

  // ─── Form Submit ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    // 1. Validation: Required fields
    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Nama produk wajib diisi';
    }

    const cleanCategory = category.trim();
    if (!cleanCategory) {
      newErrors.category = 'Kategori wajib diisi';
    }

    const cleanUnit = unit.trim();
    if (!cleanUnit) {
      newErrors.unit = 'Satuan wajib diisi';
    }

    // 2. Validation: Numeric non-negative checks
    const parseOptionalNumber = (
      val: string,
      fieldName: string
    ): number | undefined => {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      const num = Number(trimmed);
      if (isNaN(num) || num < 0) {
        newErrors[fieldName] = 'Nilai tidak boleh negatif atau tidak valid';
        return undefined;
      }
      return num;
    };

    const parsedPrice = parseOptionalNumber(price, 'price');
    const parsedPreparedPrice = parseOptionalNumber(preparedPrice, 'preparedPrice');
    const parsedCostPrice = parseOptionalNumber(costPrice, 'costPrice');

    const cleanMinStock = minStock.trim();
    const parsedMinStock = cleanMinStock === '' ? 0 : Number(cleanMinStock);
    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      newErrors.minStock = 'Stok minimum harus berupa angka >= 0';
    }

    let parsedInitialStock = 0;
    if (mode === 'create') {
      const cleanStock = stock.trim();
      parsedInitialStock = cleanStock === '' ? 0 : Number(cleanStock);
      if (isNaN(parsedInitialStock) || parsedInitialStock < 0) {
        newErrors.stock = 'Stok awal harus berupa angka >= 0';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const result = await createProductAction({
          name: cleanName,
          variant: variant.trim() || undefined,
          family: family.trim() || cleanName,
          category: cleanCategory,
          price: parsedPrice,
          preparedPrice: parsedPreparedPrice,
          costPrice: parsedCostPrice,
          stock: parsedInitialStock,
          minStock: parsedMinStock,
          unit: cleanUnit,
          iconName,
          isActive,
        });

        if (result.success) {
          // If there's a compressed image queued, upload it now
          if (compressedFile && result.data.id) {
            try {
              const formData = new FormData();
              formData.append('file', compressedFile, 'product-image.webp');
              await uploadProductImageAction(result.data.id, formData);
            } catch {
              // Product created but image failed — acceptable, admin can retry
              console.error('Product created but image upload failed.');
            }
          }
          onSuccess();
          onClose();
        } else {
          setErrors({ general: result.error.message });
        }
      } else if (mode === 'edit' && product) {
        const result = await updateProductAction(product.id, {
          name: cleanName,
          variant: variant.trim() || undefined,
          family: family.trim() || cleanName,
          category: cleanCategory,
          price: parsedPrice,
          preparedPrice: parsedPreparedPrice,
          costPrice: parsedCostPrice,
          minStock: parsedMinStock,
          unit: cleanUnit,
          iconName,
          isActive,
          // Explicitly preserve existing stock and HPP data
          stock: product.stock,
          hppComponents: product.hppComponents,
          hppNote: product.hppNote,
        });

        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setErrors({ general: result.error.message });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan produk';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out 'Semua' from existing categories suggestion list
  const categorySuggestions = categories.filter((c) => c !== 'Semua');

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Tambah Produk Baru' : 'Edit Produk'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        {/* General Error Alert */}
        {errors.general && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* SECTION 1: Identitas Produk */}
        <div className="flex flex-col gap-2.5">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Identitas Produk
          </span>

          <div>
            <label className="text-caption font-medium text-text block mb-1">
              Nama Produk <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Kapal Api"
              className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.name && (
              <p className="text-[11px] text-danger mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Varian
              </label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="Contoh: Special Mix"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Family / Merk
              </label>
              <input
                type="text"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder="Contoh: Kapal Api"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Ikon Produk */}
          <div>
            <label className="text-caption font-medium text-text block mb-1.5">
              Ikon Produk
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {AVAILABLE_ICONS.map((icon) => {
                const isSelectedIcon = iconName === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setIconName(icon)}
                    className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all shrink-0 ${
                      isSelectedIcon
                        ? 'bg-primary-soft text-primary border-primary font-semibold shadow-xs'
                        : 'bg-surface-subtle text-text-secondary border-border/80 hover:text-text'
                    }`}
                    aria-label={`Pilih ikon ${icon}`}
                  >
                    <ProductIcon name={icon} className="w-4.5 h-4.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gambar Produk */}
          <div>
            <label className="text-caption font-medium text-text block mb-1.5">
              Gambar Produk
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_STRING}
              onChange={handleImageSelect}
              className="hidden"
              id="product-image-input"
            />

            {displayImageUrl ? (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-subtle border border-border/60">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border/50 shrink-0">
                  <Image
                    src={displayImageUrl}
                    alt="Preview"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-[11px] text-text-secondary truncate">
                    {isUploadingImage ? 'Mengunggah...' : 'Gambar dipilih'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="text-[10px] font-medium text-primary bg-surface px-2 py-0.5 rounded-md border border-border hover:border-primary/50 transition-all disabled:opacity-50"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      disabled={isUploadingImage}
                      className="text-[10px] font-medium text-danger bg-surface px-2 py-0.5 rounded-md border border-border hover:border-danger/50 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border/70 hover:border-primary/50 bg-surface-subtle hover:bg-primary-soft/5 text-text-secondary hover:text-primary transition-all disabled:opacity-50"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-small font-medium">Pilih Gambar</span>
              </button>
            )}

            {errors.image && (
              <p className="text-[11px] text-danger mt-1">{errors.image}</p>
            )}
            <p className="text-[10px] text-text-muted mt-0.5">
              JPG, PNG, atau WebP. Maks 512 KB.
            </p>
          </div>
        </div>

        {/* SECTION 2: Kategori & Jenis */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Kategori & Jenis
          </span>

          <div>
            <label className="text-caption font-medium text-text block mb-1">
              Kategori <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Pilih atau ketik kategori baru..."
              list="category-suggestions"
              className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <datalist id="category-suggestions">
              {categorySuggestions.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {errors.category && (
              <p className="text-[11px] text-danger mt-1">{errors.category}</p>
            )}

            {/* Quick chips for top existing categories */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {categorySuggestions.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    category === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-subtle text-text-secondary border-border/70 hover:text-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Harga & HPP */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Harga & HPP
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Harga Jual (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Contoh: 3000"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.price && (
                <p className="text-[11px] text-danger mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="text-caption font-medium text-text block mb-1">
                HPP Dasar (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Contoh: 2000"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.costPrice && (
                <p className="text-[11px] text-danger mt-1">{errors.costPrice}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-caption font-medium text-text block mb-1">
              Harga Siap Saji / Diseduh (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={preparedPrice}
              onChange={(e) => setPreparedPrice(e.target.value)}
              placeholder="Opsional, contoh: 4000"
              className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.preparedPrice && (
              <p className="text-[11px] text-danger mt-1">{errors.preparedPrice}</p>
            )}
            <p className="text-[10px] text-text-muted mt-0.5">
              Kosongkan jika produk tidak memiliki varian siap saji/masak.
            </p>
          </div>
        </div>

        {/* SECTION 4: Satuan & Stok Minimum */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Satuan & Stok
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Satuan <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, sachet, bks"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.unit && (
                <p className="text-[11px] text-danger mt-1">{errors.unit}</p>
              )}
            </div>

            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Stok Minimum
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="0"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.minStock && (
                <p className="text-[11px] text-danger mt-1">{errors.minStock}</p>
              )}
            </div>
          </div>

          {mode === 'create' ? (
            <div>
              <label className="text-caption font-medium text-text block mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full h-9.5 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.stock && (
                <p className="text-[11px] text-danger mt-1">{errors.stock}</p>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/60 flex items-center justify-between text-small">
              <div>
                <span className="text-caption text-text-secondary block">
                  Stok Saat Ini (Hanya Baca)
                </span>
                <span className="font-semibold text-text">
                  {stock} {unit}
                </span>
              </div>
              {onAdjustStock && product ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAdjustStock(product);
                  }}
                  className="text-[11px] font-medium text-primary hover:text-primary-dark bg-surface hover:bg-surface-subtle px-2.5 py-1 rounded-lg border border-border hover:border-primary/50 shadow-2xs transition-all active:scale-95"
                >
                  Ubah via Penyesuaian Stok
                </button>
              ) : (
                <span className="text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded-md border border-border/50">
                  Ubah via Penyesuaian Stok
                </span>
              )}
            </div>
          )}
        </div>

        {/* SECTION 5: Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border/60">
          <div>
            <span className="text-small font-medium text-text block">
              Status Produk
            </span>
            <span className="text-caption text-text-secondary block">
              Tampilkan di grid kasir POS
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              isActive ? 'bg-primary' : 'bg-border'
            }`}
            aria-label="Toggle status produk"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface-subtle text-small font-medium transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-98 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Menyimpan...'
              : mode === 'create'
              ? 'Simpan Produk'
              : 'Perbarui Produk'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

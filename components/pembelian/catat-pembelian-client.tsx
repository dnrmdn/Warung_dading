'use client';

import React, { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { createPurchaseAction } from '@/app/actions/purchases';
import { getSuppliersAction } from '@/app/actions/suppliers';
import { Product, Supplier } from '@/types/warung';
import { PurchaseProductPickerSheet } from '@/components/pembelian/purchase-product-picker-sheet';
import { formatRupiah } from '@/lib/format';
import { Plus, Trash2, AlertCircle, Minus, ShoppingBag, Building, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ---------- Types ----------

interface DraftItem {
  productId: string;
  productName: string;
  unit: string;
  quantityStr: string;   // raw string for input; parsed on submit
  unitCostStr: string;   // raw string for input; parsed on submit
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parsedQty(str: string): number | null {
  const n = Number(str.trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parsedCost(str: string): number | null {
  const n = Number(str.trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function derivedSubtotal(item: DraftItem): number | null {
  const qty = parsedQty(item.quantityStr);
  const cost = parsedCost(item.unitCostStr);
  if (qty === null || cost === null) return null;
  return qty * cost;
}

// ---------- Component ----------

interface CatatPembelianClientProps {
  initialProducts: Product[];
}

export function CatatPembelianClient({ initialProducts }: CatatPembelianClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- Suppliers ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  // --- Form header fields ---
  const [purchaseDate, setPurchaseDate] = useState(todayISO);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(''); // '' represents "Tanpa Supplier" (null)
  const [note, setNote] = useState('');

  // --- Draft items ---
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  // --- UI state ---
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch registered active suppliers on mount
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await getSuppliersAction({ activeOnly: true });
        if (res.success) {
          setSuppliers(res.data);
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }
    loadSuppliers();
  }, []);

  // --- Derived ---
  const selectedProductIds = useMemo(
    () => draftItems.map((i) => i.productId),
    [draftItems]
  );

  const derivedTotal = useMemo(() => {
    let total = 0;
    for (const item of draftItems) {
      const sub = derivedSubtotal(item);
      if (sub === null) return null; // any invalid item → total unknown
      total += sub;
    }
    return total;
  }, [draftItems]);

  // --- Handlers ---
  const handleProductSelect = useCallback(
    (product: Product) => {
      setIsPickerOpen(false);
      setDraftItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantityStr: '1',
          unitCostStr:
            typeof product.costPrice === 'number' &&
            Number.isFinite(product.costPrice) &&
            product.costPrice >= 0
              ? String(Math.round(product.costPrice))
              : '0',
        },
      ]);
      // Clear any item-level errors on add
      setErrors((prev) => {
        const next = { ...prev };
        delete next.items;
        return next;
      });
    },
    []
  );

  const handleRemoveItem = useCallback((productId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const handleQtyChange = useCallback(
    (productId: string, value: string) => {
      setDraftItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantityStr: value } : i
        )
      );
    },
    []
  );

  const handleQtyStep = useCallback(
    (productId: string, delta: number) => {
      setDraftItems((prev) =>
        prev.map((i) => {
          if (i.productId !== productId) return i;
          const current = parsedQty(i.quantityStr) ?? 1;
          const next = Math.max(1, current + delta);
          return { ...i, quantityStr: String(next) };
        })
      );
    },
    []
  );

  const handleUnitCostChange = useCallback(
    (productId: string, value: string) => {
      setDraftItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, unitCostStr: value } : i
        )
      );
    },
    []
  );

  // --- Validation & Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const newErrors: Record<string, string> = {};

    if (!purchaseDate.trim()) {
      newErrors.purchaseDate = 'Tanggal pembelian wajib diisi.';
    }

    if (draftItems.length === 0) {
      newErrors.items = 'Tambahkan minimal 1 barang ke dalam nota pembelian.';
    }

    // Validate each item
    for (const item of draftItems) {
      if (parsedQty(item.quantityStr) === null) {
        newErrors[`qty_${item.productId}`] =
          'Jumlah harus berupa bilangan bulat positif.';
      }
      if (parsedCost(item.unitCostStr) === null) {
        newErrors[`cost_${item.productId}`] =
          'Harga beli harus berupa bilangan bulat non-negatif (>= 0).';
      }
    }

    // Duplicate check (should not happen normally, but defensive)
    const ids = draftItems.map((i) => i.productId);
    if (new Set(ids).size !== ids.length) {
      newErrors.items = 'Terdapat duplikasi produk dalam nota pembelian.';
    }

    // Product still exists
    const productMap = new Map(initialProducts.map((p) => [p.id, p]));
    for (const item of draftItems) {
      if (!productMap.has(item.productId)) {
        newErrors.items = `Produk "${item.productName}" tidak lagi ditemukan di katalog.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await createPurchaseAction({
        purchaseDate: purchaseDate.trim(),
        supplierId: selectedSupplierId ? selectedSupplierId : null,
        note: note.trim() || undefined,
        items: draftItems.map((item) => ({
          productId: item.productId,
          quantity: parsedQty(item.quantityStr)!,
          unitCost: parsedCost(item.unitCostStr)!,
        })),
      });

      if (!result.success) {
        setErrors({ general: result.error.message });
        return;
      }

      // On success navigate back to /pembelian
      router.push('/pembelian');
    });
  };

  // ---------- Render ----------
  return (
    <AppShell>
      <HeaderBar
        title="Catat Pembelian"
        subtitle="Nota belanja baru"
        backHref="/pembelian"
      />

      {/* Scroll container with bottom padding for sticky total bar */}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-36">

        {/* General Error */}
        {errors.general && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ---- SECTION: Info Pembelian ---- */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-border">
          <h2 className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Info Pembelian
          </h2>

          {/* Tanggal Pembelian */}
          <div>
            <label
              htmlFor="purchase-date"
              className="text-caption font-medium text-text block mb-1"
            >
              Tanggal Pembelian <span className="text-danger">*</span>
            </label>
            <input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.purchaseDate && (
              <p className="text-[11px] text-danger mt-1">{errors.purchaseDate}</p>
            )}
          </div>

          {/* Supplier Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="supplier-select"
                className="text-caption font-medium text-text flex items-center gap-1"
              >
                <Building className="w-3.5 h-3.5 text-text-muted" />
                <span>Supplier / Mitra Pemasok</span>
              </label>
              <Link
                href="/supplier/baru"
                className="text-[11px] text-primary font-medium hover:underline"
              >
                + Tambah Baru
              </Link>
            </div>
            <div className="relative">
              <select
                id="supplier-select"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                disabled={isLoadingSuppliers}
                className="w-full h-9 pl-3 pr-8 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-60"
              >
                <option value="">Tanpa Supplier (Non-relasional)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Pilih dari mitra terdaftar atau biarkan &quot;Tanpa Supplier&quot;.
            </p>
          </div>

          {/* Catatan */}
          <div>
            <label
              htmlFor="purchase-note"
              className="text-caption font-medium text-text block mb-1"
            >
              Catatan
            </label>
            <textarea
              id="purchase-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nomor nota atau catatan belanja (opsional)"
              rows={2}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* ---- SECTION: Daftar Barang ---- */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
              Daftar Barang
            </h2>
            <span className="text-caption text-text-muted">
              {draftItems.length} {draftItems.length === 1 ? 'barang' : 'macam barang'}
            </span>
          </div>

          {/* Items error */}
          {errors.items && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errors.items}</span>
            </div>
          )}

          {/* Draft item cards */}
          {draftItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {draftItems.map((item) => {
                const sub = derivedSubtotal(item);
                const qtyError = errors[`qty_${item.productId}`];
                const costError = errors[`cost_${item.productId}`];

                return (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-2.5 p-3.5 bg-surface rounded-xl border border-border"
                  >
                    {/* Product name + remove */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-small font-semibold text-text truncate flex-1">
                        {item.productName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft/30 active:scale-95 transition-all shrink-0"
                        aria-label={`Hapus ${item.productName} dari nota`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Qty row */}
                    <div className="flex flex-col gap-1">
                      <label className="text-caption text-text-secondary">
                        Jumlah ({item.unit})
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQtyStep(item.productId, -1)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface-subtle text-text-secondary hover:text-primary hover:border-primary active:scale-95 transition-all shrink-0"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          value={item.quantityStr}
                          onChange={(e) =>
                            handleQtyChange(item.productId, e.target.value)
                          }
                          className="w-16 h-8 text-center bg-surface border border-border rounded-lg text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          aria-label={`Jumlah ${item.productName}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyStep(item.productId, 1)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface-subtle text-text-secondary hover:text-primary hover:border-primary active:scale-95 transition-all shrink-0"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {qtyError && (
                        <p className="text-[11px] text-danger">{qtyError}</p>
                      )}
                    </div>

                    {/* Unit cost row */}
                    <div className="flex flex-col gap-1">
                      <label className="text-caption text-text-secondary">
                        Harga beli / {item.unit} (Rp)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={item.unitCostStr}
                        onChange={(e) =>
                          handleUnitCostChange(item.productId, e.target.value)
                        }
                        className="w-full h-9 px-3 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label={`Harga beli ${item.productName}`}
                        placeholder="0"
                      />
                      {costError && (
                        <p className="text-[11px] text-danger">{costError}</p>
                      )}
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-caption text-text-secondary">Subtotal</span>
                      <span
                        className={
                          sub !== null
                            ? 'text-small font-bold text-text'
                            : 'text-small text-text-muted italic'
                        }
                      >
                        {sub !== null ? formatRupiah(sub) : '–'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add item button */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-primary/50 bg-primary-soft/10 text-primary text-small font-semibold hover:bg-primary-soft/20 active:scale-[0.99] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Tambah Barang
          </button>

          {/* Empty state when 0 items */}
          {draftItems.length === 0 && !errors.items && (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <ShoppingBag className="w-8 h-8 text-text-muted stroke-[1.5]" />
              <p className="text-small text-text-muted">
                Belum ada barang. Ketuk &quot;Tambah Barang&quot; untuk memilih produk.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---- STICKY BOTTOM BAR ---- */}
      <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
        <div className="w-full max-w-lg bg-surface/95 backdrop-blur border-t border-border px-4 pt-3 pb-5 flex flex-col gap-2.5 pointer-events-auto">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-small font-semibold text-text-secondary">Total Pembelian</span>
            <span
              className={
                derivedTotal !== null
                  ? 'text-body-medium font-bold text-text'
                  : 'text-body-medium text-text-muted italic'
              }
            >
              {derivedTotal !== null ? formatRupiah(derivedTotal) : '–'}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            onClick={handleSubmit}
            className="w-full flex items-center justify-center h-11 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Pembelian'}
          </button>
        </div>
      </div>

      {/* Product Picker Sheet */}
      <PurchaseProductPickerSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        products={initialProducts}
        selectedProductIds={selectedProductIds}
        onSelect={handleProductSelect}
      />
    </AppShell>
  );
}

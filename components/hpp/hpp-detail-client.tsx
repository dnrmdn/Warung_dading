'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Product, HPPComponent } from '@/types/warung';
import type { PickerProduct } from '@/lib/services/products';
import { updateProductAction } from '@/app/actions/products';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { ProductIcon } from '@/components/ui/product-icon';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import {
  AlertTriangle,
  Info,
  Link2,
  PieChart,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Calculator,
  Loader2,
  X,
  Search,
  ChevronDown,
} from 'lucide-react';

interface HppDetailClientProps {
  initialProduct: Product;
  availableProducts: PickerProduct[];
}

export function HppDetailClient({ initialProduct, availableProducts }: HppDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const product = initialProduct;
  const components = useMemo(
    () => product.hppComponents ?? [],
    [product.hppComponents]
  );

  const productMap = useMemo(() => {
    const m = new Map<string, PickerProduct>();
    for (const p of availableProducts) m.set(p.id, p);
    return m;
  }, [availableProducts]);

  // Modal / Form state for Add and Edit actions
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formUnitCost, setFormUnitCost] = useState('0');
  const [formMaterialProductId, setFormMaterialProductId] = useState<string | null>(null);

  // Inline product picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const filteredPickerProducts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const bahanOnly = availableProducts.filter((p) => p.inventoryType === 'bahan');
    const list = q.length === 0
      ? bahanOnly
      : bahanOnly.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.family || '').toLowerCase().includes(q) ||
          (p.variant || '').toLowerCase().includes(q)
        );
    return list.slice(0, 50);
  }, [availableProducts, pickerQuery]);

  const selectedProductForForm = formMaterialProductId
    ? productMap.get(formMaterialProductId)
    : undefined;

  const unitMismatch = Boolean(
    selectedProductForForm &&
    formUnit.trim().length > 0 &&
    formUnit.trim().toLowerCase() !== selectedProductForForm.unit.trim().toLowerCase()
  );

  // Real-time derived calculations from components
  const totalCalculatedHpp = useMemo(() => {
    if (components.length === 0) return undefined;
    return components.reduce(
      (sum, c) => sum + Number(c.quantity || 0) * Number(c.unitCost || 0),
      0
    );
  }, [components]);

  const grossProfit = useMemo(() => {
    if (product.price === undefined || totalCalculatedHpp === undefined) {
      return undefined;
    }
    return product.price - totalCalculatedHpp;
  }, [product.price, totalCalculatedHpp]);

  const marginPercent = useMemo(() => {
    if (grossProfit === undefined || !product.price) return undefined;
    return Math.round((grossProfit / product.price) * 100);
  }, [grossProfit, product.price]);

  // Open form for adding a new component
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormQuantity('1');
    setFormUnit('pcs');
    setFormUnitCost('');
    setFormMaterialProductId(null);
    setPickerQuery('');
    setPickerOpen(false);
    setIsFormOpen(true);
  };

  // Open form for editing an existing component
  const handleOpenEdit = (comp: HPPComponent) => {
    setEditingId(comp.id);
    setFormName(comp.name);
    setFormQuantity(String(comp.quantity));
    setFormUnit(comp.unit);
    setFormUnitCost(String(comp.unitCost));
    setFormMaterialProductId(comp.materialProductId ?? null);
    setPickerQuery('');
    setPickerOpen(false);
    setIsFormOpen(true);
  };

  // Remove component handler
  const handleRemove = (compId: string) => {
    const nextComponents = components.filter((c) => c.id !== compId);
    startTransition(async () => {
      const res = await updateProductAction(product.id, {
        hppComponents: nextComponents,
      });
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error?.message || 'Gagal menghapus komponen');
      }
    });
  };

  // Save form handler (Add or Edit)
  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(0.01, Number(formQuantity) || 1);
    const cost = Math.max(0, Number(formUnitCost) || 0);
    const cleanName = formName.trim() || 'Bahan';
    const cleanUnit = formUnit.trim() || 'pcs';

    const materialProductIdForPayload: string | undefined =
      formMaterialProductId ?? undefined;

    let nextComponents: HPPComponent[];
    if (editingId) {
      // Update existing component
      nextComponents = components.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: cleanName,
              quantity: qty,
              unit: cleanUnit,
              unitCost: cost,
              materialProductId: materialProductIdForPayload,
            }
          : c
      );
    } else {
      // Add new component
      const newComp: HPPComponent = {
        id: `comp-${Date.now()}`,
        name: cleanName,
        quantity: qty,
        unit: cleanUnit,
        unitCost: cost,
        materialProductId: materialProductIdForPayload,
      };
      nextComponents = [...components, newComp];
    }

    startTransition(async () => {
      const res = await updateProductAction(product.id, {
        hppComponents: nextComponents,
      });
      if (res.success) {
        setIsFormOpen(false);
        setPickerOpen(false);
        router.refresh();
      } else {
        alert(res.error?.message || 'Gagal menyimpan komponen HPP');
      }
    });
  };

  // Picker helper actions
  const handleSelectMaterialProduct = (p: PickerProduct) => {
    // Passive link only — do NOT overwrite name/unit/unitCost
    setFormMaterialProductId(p.id);
    setPickerOpen(false);
    setPickerQuery('');
  };

  const handleClearMaterialProduct = () => {
    setFormMaterialProductId(null);
  };

  // Form preview subtotal
  const formSubtotal =
    (Number(formQuantity) || 0) * (Number(formUnitCost) || 0);

  return (
    <AppShell>
      <HeaderBar
        title="Rincian HPP"
        subtitle={product.name}
        backHref={`/produk/${product.id}`}
        rightAction={
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-xs disabled:opacity-50"
            aria-label="Tambah komponen"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Tambah</span>
          </button>
        }
      />

      <div className="flex flex-col gap-3.5 p-4">
        {/* Product & Derived Margin Overview Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-subtle text-primary border border-border/60 shrink-0">
              <ProductIcon name={product.iconName} className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-h3 text-text truncate">{product.name}</h2>
              <p className="text-caption text-text-secondary">
                Kategori: {product.category} • Satuan: {product.unit}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
            <div className="p-2 rounded-xl bg-surface-subtle">
              <span className="text-caption text-text-secondary block">Harga Jual</span>
              <span className="text-body-medium font-bold text-primary block mt-0.5">
                {formatRupiah(product.price)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-surface-subtle">
              <span className="text-caption text-text-secondary block">Total HPP</span>
              <span className="text-body-medium font-bold text-text block mt-0.5">
                {totalCalculatedHpp !== undefined
                  ? formatRupiah(totalCalculatedHpp)
                  : '-'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-surface-subtle">
              <span className="text-caption text-text-secondary block">Margin</span>
              <span className="text-body-medium font-bold text-success block mt-0.5">
                {marginPercent !== undefined ? `${marginPercent}%` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Editable HPP Components List Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-body-medium font-semibold text-text">
                Komponen Biaya / Resep
              </h3>
            </div>
            <span className="text-caption text-text-muted">
              {components.length} komponen
            </span>
          </div>

          {components.length > 0 ? (
            <>
              <div className="flex flex-col divide-y divide-border/60">
                {components.map((comp) => {
                  const subtotal = comp.quantity * comp.unitCost;
                  const linked = !!comp.materialProductId;
                  const linkedProduct = comp.materialProductId
                    ? productMap.get(comp.materialProductId)
                    : undefined;
                  return (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between py-2.5 gap-2 text-small group"
                    >
                      {/* Left: Name and Formula */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-text block truncate">
                            {comp.name}
                          </span>
                          {linked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary-soft/50 border border-primary/20 text-[10px] font-medium text-primary shrink-0">
                              <Link2 className="w-2.5 h-2.5" />
                              {linkedProduct ? linkedProduct.name : 'Produk stok'}
                            </span>
                          )}
                        </div>
                        <span className="text-caption text-text-secondary block">
                          {comp.quantity} {comp.unit} × {formatRupiah(comp.unitCost)}
                        </span>
                      </div>

                      {/* Right: Subtotal and Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-text">
                          {formatRupiah(subtotal)}
                        </span>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(comp)}
                            disabled={isPending}
                            className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-surface-subtle transition-colors disabled:opacity-50"
                            aria-label={`Edit ${comp.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(comp.id)}
                            disabled={isPending}
                            className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger-soft/30 transition-colors disabled:opacity-50"
                            aria-label={`Hapus ${comp.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal & Total HPP Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border font-medium text-small">
                <span className="text-text-secondary">Total HPP per Porsi</span>
                <span className="text-body-medium font-bold text-text">
                  {formatRupiah(totalCalculatedHpp)}
                </span>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-text-secondary text-small flex flex-col items-center">
              <Calculator className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
              <p className="font-medium text-text">HPP belum dikonfigurasi</p>
              <p className="text-caption text-text-muted mt-0.5">
                Tambahkan komponen bahan baku untuk mulai menghitung HPP resep.
              </p>
            </div>
          )}

          {/* Add Component Action Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 mt-1 rounded-xl border border-dashed border-border hover:border-primary/60 text-small font-medium text-text-secondary hover:text-primary transition-all active:scale-98 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Komponen Biaya</span>
          </button>
        </div>

        {/* Live Estimated Gross Profit Card */}
        {grossProfit !== undefined && marginPercent !== undefined && (
          <div className="p-4 rounded-2xl bg-success-soft/30 border border-success/30 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-success-soft text-success">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-caption font-medium text-success-dark block">
                  Estimasi Keuntungan Bersih
                </span>
                <span className="text-body-medium font-bold text-text block">
                  {formatRupiah(grossProfit)} per {product.unit}
                </span>
              </div>
            </div>
            <span className="text-h3 font-bold text-success">{marginPercent}%</span>
          </div>
        )}

        {/* Explanatory HPP Note */}
        {product.hppNote && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-surface border border-border text-caption text-text-secondary shadow-2xs">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">{product.hppNote}</p>
          </div>
        )}
      </div>

      {/* Add / Edit Component Bottom Sheet Form */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya'}
      >
        <form onSubmit={handleSaveComponent} className="flex flex-col gap-3 py-1">
          {/* Material Product Picker (passive link) */}
          <div>
            <label className="text-caption font-semibold text-text-secondary block mb-1">
              Hubungkan dengan Produk Stok (Opsional)
            </label>

            {selectedProductForForm ? (
              <div className="w-full rounded-xl bg-primary-soft/40 border border-primary/30 p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface text-primary border border-border/60 shrink-0">
                  <ProductIcon name={selectedProductForForm.iconName} className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-small font-semibold text-text truncate">
                      {selectedProductForForm.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium inline-flex items-center gap-0.5">
                      <Link2 className="w-2.5 h-2.5" />
                      Tersambung
                    </span>
                  </div>
                  <span className="text-caption text-text-secondary block">
                    {selectedProductForForm.category} • stok satuan: {selectedProductForForm.unit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearMaterialProduct}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft/30 transition-colors shrink-0"
                  aria-label="Lepas hubungan produk"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full h-10 px-3 flex items-center justify-between bg-surface border border-border rounded-xl text-small text-text-secondary hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <span className="flex items-center gap-2 text-text-muted">
                    <Search className="w-3.5 h-3.5" />
                    Cari & pilih produk stok…
                  </span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {pickerOpen && (
                  <div className="mt-1.5 rounded-xl border border-border bg-surface overflow-hidden shadow-md max-h-72 flex flex-col z-20 relative">
                    <div className="p-2 border-b border-border/60">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                          type="text"
                          value={pickerQuery}
                          onChange={(e) => setPickerQuery(e.target.value)}
                          placeholder="Cari nama produk…"
                          autoFocus
                          className="w-full h-9 pl-8 pr-2.5 bg-surface-subtle border border-border/60 rounded-lg text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto">
                      {filteredPickerProducts.length === 0 ? (
                        <div className="p-4 text-center text-caption text-text-muted">
                          Produk tidak ditemukan
                        </div>
                      ) : (
                        <ul className="flex flex-col">
                          {filteredPickerProducts.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectMaterialProduct(p)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-subtle transition-colors text-left"
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-subtle text-primary border border-border/60 shrink-0">
                                  <ProductIcon name={p.iconName} className="w-4 h-4 stroke-[1.8]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-small font-medium text-text block truncate">{p.name}</span>
                                  <span className="text-caption text-text-muted block">
                                    {p.category} • {p.unit}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nama Komponen */}
          <div>
            <label className="text-caption font-semibold text-text-secondary block mb-1">
              Nama Komponen / Bahan {selectedProductForForm && <span className="text-text-muted font-normal">· snapshot tersimpan di resep</span>}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Sachet, Plastik, Es, Gula"
              required
              className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Jumlah dan Satuan */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-caption font-semibold text-text-secondary block mb-1">
                Jumlah
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                placeholder="1"
                required
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-text-secondary block mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="pcs, sachet, gelas"
                required
                className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Unit mismatch soft warning */}
          {unitMismatch && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-warning-soft/40 border border-warning/30 text-caption text-warning-dark">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Satuan resep berbeda dengan satuan produk stok (produk:{' '}
                <strong>{selectedProductForForm?.unit}</strong> · resep:{' '}
                <strong>{formUnit}</strong>). Perbedaan ini disengaja, tidak dikonversi otomatis.
              </p>
            </div>
          )}

          {/* Harga Satuan */}
          <div>
            <label className="text-caption font-semibold text-text-secondary block mb-1">
              Harga Satuan (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formUnitCost}
              onChange={(e) => setFormUnitCost(e.target.value)}
              placeholder="Contoh: 300"
              required
              className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Subtotal Calculation Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border/60 text-small">
            <span className="text-text-secondary">Subtotal Biaya:</span>
            <span className="font-bold text-primary">
              {formatRupiah(formSubtotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-subtle text-small font-medium transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Simpan Komponen</span>
            </button>
          </div>
        </form>
      </BottomSheet>
    </AppShell>
  );
}

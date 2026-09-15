'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Product, HPPComponent } from '@/types/warung';
import { updateProductAction } from '@/app/actions/products';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { ProductIcon } from '@/components/ui/product-icon';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatRupiah } from '@/lib/format';
import {
  Info,
  PieChart,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Calculator,
  Loader2,
} from 'lucide-react';

interface HppDetailClientProps {
  initialProduct: Product;
}

export function HppDetailClient({ initialProduct }: HppDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const product = initialProduct;
  const components = useMemo(
    () => product.hppComponents ?? [],
    [product.hppComponents]
  );

  // Modal / Form state for Add and Edit actions
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formUnitCost, setFormUnitCost] = useState('0');

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
    setIsFormOpen(true);
  };

  // Open form for editing an existing component
  const handleOpenEdit = (comp: HPPComponent) => {
    setEditingId(comp.id);
    setFormName(comp.name);
    setFormQuantity(String(comp.quantity));
    setFormUnit(comp.unit);
    setFormUnitCost(String(comp.unitCost));
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
      };
      nextComponents = [...components, newComp];
    }

    startTransition(async () => {
      const res = await updateProductAction(product.id, {
        hppComponents: nextComponents,
      });
      if (res.success) {
        setIsFormOpen(false);
        router.refresh();
      } else {
        alert(res.error?.message || 'Gagal menyimpan komponen HPP');
      }
    });
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
                  return (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between py-2.5 gap-2 text-small group"
                    >
                      {/* Left: Name and Formula */}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-text block truncate">
                          {comp.name}
                        </span>
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
          {/* Nama Komponen */}
          <div>
            <label className="text-caption font-semibold text-text-secondary block mb-1">
              Nama Komponen / Bahan
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

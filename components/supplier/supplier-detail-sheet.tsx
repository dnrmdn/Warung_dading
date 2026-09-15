'use client';

import React, { useState, useTransition } from 'react';
import { Supplier } from '@/types/warung';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { updateSupplierAction, toggleSupplierActiveAction } from '@/app/actions/suppliers';
import { useRouter } from 'next/navigation';
import {
  Store,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Check,
  Power,
} from 'lucide-react';

interface SupplierDetailSheetProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailSheet({
  supplier,
  open,
  onOpenChange,
}: SupplierDetailSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNote, setEditNote] = useState('');
  const [error, setError] = useState('');

  function handleStartEdit() {
    if (!supplier) return;
    setEditName(supplier.name);
    setEditPhone(supplier.phone ?? '');
    setEditAddress(supplier.address ?? '');
    setEditNote(supplier.note ?? '');
    setError('');
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setError('');
  }

  function handleSaveEdit() {
    if (!supplier || isPending) return;
    setError('');

    startTransition(async () => {
      const result = await updateSupplierAction(supplier.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        note: editNote.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setIsEditing(false);
      router.refresh();
    });
  }

  function handleToggleActive() {
    if (!supplier || isPending) return;
    setError('');

    startTransition(async () => {
      const result = await toggleSupplierActiveAction(supplier.id);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  function handleClose() {
    setIsEditing(false);
    setError('');
    onOpenChange(false);
  }

  return (
    <BottomSheet
      isOpen={open && supplier !== null}
      onClose={handleClose}
      title={isEditing ? 'Edit Supplier' : 'Detail Supplier'}
    >
      {supplier && (
        <div className="flex flex-col gap-4 pb-4">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            /* ---- EDIT MODE ---- */
            <div className="flex flex-col gap-3">
              {/* Name */}
              <div>
                <label htmlFor="edit-supplier-name" className="text-caption font-medium text-text block mb-1">
                  Nama Supplier <span className="text-danger">*</span>
                </label>
                <input
                  id="edit-supplier-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 px-3 bg-surface border border-border rounded-xl text-small text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="edit-supplier-phone" className="text-caption font-medium text-text block mb-1">
                  No. Telepon
                </label>
                <input
                  id="edit-supplier-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(opsional)"
                  className="w-full h-9 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="edit-supplier-address" className="text-caption font-medium text-text block mb-1">
                  Alamat
                </label>
                <textarea
                  id="edit-supplier-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="(opsional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Note */}
              <div>
                <label htmlFor="edit-supplier-note" className="text-caption font-medium text-text block mb-1">
                  Catatan
                </label>
                <textarea
                  id="edit-supplier-note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="(opsional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Edit Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="flex-1 h-10 rounded-xl border border-border text-small font-semibold text-text hover:bg-surface-subtle active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending || !editName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          ) : (
            /* ---- VIEW MODE ---- */
            <>
              {/* Info Card */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface-subtle border border-border/60">
                {/* Name */}
                <div className="flex items-start gap-2">
                  <Store className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-caption text-text-secondary block">Nama Supplier</span>
                    <span className="text-small font-medium text-text">{supplier.name}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-caption text-text-secondary block">No. Telepon</span>
                    <span className="text-small font-medium text-text">
                      {supplier.phone || (
                        <span className="text-text-muted italic">Belum diisi</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-caption text-text-secondary block">Alamat</span>
                    <span className="text-small font-medium text-text">
                      {supplier.address || (
                        <span className="text-text-muted italic">Belum diisi</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Note */}
                {supplier.note && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-caption text-text-secondary block">Catatan</span>
                      <span className="text-small text-text">{supplier.note}</span>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-2 pt-1 mt-1 border-t border-border/40">
                  <span className="text-caption text-text-secondary">Status:</span>
                  <span className={`text-caption font-semibold ${supplier.isActive ? 'text-success' : 'text-text-muted'}`}>
                    {supplier.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full h-10 rounded-xl bg-primary text-white text-small font-semibold hover:bg-primary-dark active:scale-[0.99] transition-all"
                >
                  Edit Supplier
                </button>

                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={isPending}
                  className={`w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border text-small font-semibold active:scale-[0.99] transition-all disabled:opacity-60 ${
                    supplier.isActive
                      ? 'border-warning/40 text-warning hover:bg-warning/5'
                      : 'border-success/40 text-success hover:bg-success/5'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {isPending
                    ? 'Memproses...'
                    : supplier.isActive
                    ? 'Nonaktifkan Supplier'
                    : 'Aktifkan Kembali'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

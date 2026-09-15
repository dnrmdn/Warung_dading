'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { HeaderBar } from '@/components/navigation/header-bar';
import { createSupplierAction } from '@/app/actions/suppliers';
import { AlertCircle, Building, Phone, MapPin, FileText } from 'lucide-react';

export function TambahSupplierClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // UI / Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama supplier wajib diisi.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await createSupplierAction({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!result.success) {
        setErrors({ general: result.error.message });
        return;
      }

      router.push('/supplier');
    });
  };

  return (
    <AppShell>
      <HeaderBar
        title="Tambah Supplier"
        subtitle="Daftarkan mitra pemasok baru"
        backHref="/supplier"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pb-32">
        {/* General Error Banner */}
        {errors.general && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Name Field Card */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface border border-border">
          <label
            htmlFor="supplier-name"
            className="text-caption font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5 text-primary" />
            <span>Nama Supplier / Toko <span className="text-danger">*</span></span>
          </label>
          <input
            id="supplier-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Agen Sembako Barokah, Toko Beras Jaya"
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-body font-semibold text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            autoFocus
          />
          {errors.name && (
            <p className="text-[11px] text-danger">{errors.name}</p>
          )}
          <p className="text-caption text-text-muted">
            Nama harus unik dan belum terdaftar sebelumnya.
          </p>
        </div>

        {/* Contact Info Card */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-border">
          <span className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
            Informasi Kontak & Lokasi
          </span>

          {/* Phone */}
          <div>
            <label
              htmlFor="supplier-phone"
              className="text-caption font-medium text-text flex items-center gap-1.5 mb-1"
            >
              <Phone className="w-3.5 h-3.5 text-text-muted" />
              <span>Nomor Telepon / WhatsApp</span>
            </label>
            <input
              id="supplier-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="supplier-address"
              className="text-caption font-medium text-text flex items-center gap-1.5 mb-1"
            >
              <MapPin className="w-3.5 h-3.5 text-text-muted" />
              <span>Alamat Toko / Gudang</span>
            </label>
            <textarea
              id="supplier-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Pasar Induk Blok B No. 12"
              rows={2}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="supplier-note"
              className="text-caption font-medium text-text flex items-center gap-1.5 mb-1"
            >
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span>Catatan Khusus</span>
            </label>
            <textarea
              id="supplier-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Jadwal antar tiap hari Selasa, minimal order 5 dus..."
              rows={2}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-small text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Sticky Submit Bar */}
        <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full max-w-lg bg-surface/95 backdrop-blur border-t border-border px-4 pt-3 pb-5 flex flex-col gap-2.5 pointer-events-auto">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center h-11 rounded-xl bg-primary text-white font-semibold text-small hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Supplier'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

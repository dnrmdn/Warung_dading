'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getSessionUserAction } from '@/app/actions/auth';
import { Store, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setErrorMsg(null);
    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setIsPending(true);

    try {
      const response = await authClient.signIn.email({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (response.error) {
        setErrorMsg(
          response.error.message || 'Email atau password salah. Silakan periksa kembali.'
        );
        setIsPending(false);
        return;
      }

      // Resolve authenticated session and role server-side
      const sessionResult = await getSessionUserAction();
      const destination =
        sessionResult.success && sessionResult.data?.role === 'OWNER'
          ? '/laporan'
          : '/';

      router.push(destination);
      router.refresh();
    } catch (err: unknown) {
      console.error('[Login Error]:', err);
      setErrorMsg('Terjadi kesalahan saat masuk ke sistem. Silakan coba lagi.');
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-8 bg-background text-text">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <Store className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-display font-bold text-text tracking-tight">Warung Smart</h1>
            <p className="text-small text-text-secondary">Masuk untuk mengelola operasional warung</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col gap-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-small">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
                Email Akun
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@warung.local"
                  className="w-full h-11 pl-10 pr-3.5 bg-surface-subtle border border-border rounded-xl text-small font-medium text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-caption font-semibold text-text-secondary uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 bg-surface-subtle border border-border rounded-xl text-small font-medium text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 mt-1 rounded-xl bg-primary text-white font-semibold text-small flex items-center justify-center gap-2 hover:bg-primary-dark active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-caption text-text-muted">
          Warung App © 2026 • Sistem Keamanan Terotorisasi
        </p>
      </div>
    </div>
  );
}

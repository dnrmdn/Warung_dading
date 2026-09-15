'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-surface rounded-t-2xl border-t border-border shadow-2xl z-10 flex flex-col max-h-[85dvh] transition-transform animate-in slide-in-from-bottom duration-250',
          className
        )}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header if title provided */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <h3 className="text-body-medium font-semibold text-text">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-subtle"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto px-4 py-3 flex-1">{children}</div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export function HeaderBar({
  title,
  subtitle,
  backHref,
  rightAction,
  className,
}: HeaderBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur border-b border-border/80',
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div className="truncate">
          <h1 className="text-h3 text-text truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-caption text-text-secondary truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
    </header>
  );
}

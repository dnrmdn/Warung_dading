import React from 'react';

interface PublicHeaderProps {
  title?: string;
  subtitle?: string;
}

export function PublicHeader({
  title = 'Warung Dading',
  subtitle = 'Katalog Stok Barang',
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/95 backdrop-blur border-b border-border">
      <div className="flex flex-col min-w-0">
        <h1 className="text-body-large font-bold text-text truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-caption text-text-secondary truncate -mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryChipsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-1.5 border-b border-border/60 bg-background/90 backdrop-blur sticky top-14 z-20',
        className
      )}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={cn(
              'px-2.5 py-1 rounded-full text-caption font-medium whitespace-nowrap transition-all border',
              isSelected
                ? 'bg-text text-background border-text shadow-xs'
                : 'bg-surface text-text-secondary border-border hover:border-text-secondary hover:text-text'
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

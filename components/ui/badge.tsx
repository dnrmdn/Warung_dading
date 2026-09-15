import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'muted';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-surface-subtle text-text-secondary border-border',
    success: 'bg-success-soft text-success border-success/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
    danger: 'bg-danger-soft text-danger border-danger/30',
    primary: 'bg-primary-soft text-primary-dark border-primary/30',
    muted: 'bg-surface-subtle text-text-muted border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium border leading-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

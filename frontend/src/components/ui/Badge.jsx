import React from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'bg-surface-accent text-slate-300 border-border-subtle',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  gold: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  crimson: 'bg-red-500/10 text-red-400 border-red-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  outline: 'bg-transparent text-slate-400 border-slate-700',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-[11px] font-medium rounded',
  md: 'px-2.5 py-1 text-xs font-semibold rounded-md',
  lg: 'px-3 py-1.5 text-sm font-semibold rounded-lg',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border leading-none whitespace-nowrap select-none',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColor || 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
};

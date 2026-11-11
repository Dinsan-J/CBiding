import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-accent/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-700/20 before:to-transparent',
        className
      )}
      {...props}
    />
  );
};

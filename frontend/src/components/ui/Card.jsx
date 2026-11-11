import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { hoverLift } from '../../utils/motion';

export const Card = ({
  children,
  className,
  isInteractive = false,
  glass = false,
  ...props
}) => {
  const Component = isInteractive ? motion.div : 'div';
  const motionProps = isInteractive ? { variants: hoverLift, whileHover: "hover" } : {};

  return (
    <Component
      className={cn(
        'rounded-xl border border-border-subtle p-5 shadow-card transition-colors',
        glass ? 'glass-card' : 'bg-surface-card',
        isInteractive && 'cursor-pointer hover:border-slate-600',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

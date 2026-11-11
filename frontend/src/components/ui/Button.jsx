import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { buttonPress } from '../../utils/motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-semibold shadow-glow-cyan border border-cyan-400/30',
  secondary: 'bg-surface-accent hover:bg-surface-hover text-slate-100 border border-border-subtle',
  success: 'bg-brand-emerald hover:bg-emerald-400 text-slate-950 font-semibold shadow-glow-emerald border border-emerald-400/30',
  danger: 'bg-brand-crimson hover:bg-red-500 text-white font-semibold shadow-glow-crimson border border-red-400/30',
  gold: 'bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold shadow-glow-gold border border-amber-400/30',
  outline: 'bg-transparent hover:bg-surface-accent text-slate-200 border border-border-subtle hover:border-slate-500',
  ghost: 'bg-transparent hover:bg-surface-accent text-slate-300 hover:text-white',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
  md: 'px-4 py-2 text-sm font-medium rounded-lg',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl',
  xl: 'px-7 py-3.5 text-lg font-bold rounded-xl tracking-wide',
};

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  onClick,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      variants={buttonPress}
      initial="rest"
      whileHover={disabled || isLoading ? undefined : "hover"}
      whileTap={disabled || isLoading ? undefined : "tap"}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}
      
      <span>{children}</span>

      {!isLoading && RightIcon && (
        <RightIcon className="w-4 h-4 shrink-0" />
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

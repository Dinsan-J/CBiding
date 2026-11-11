import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const TabGroup = ({
  tabs = [],
  activeTab,
  onChange,
  className,
  layoutId = 'activeTabPill'
}) => {
  return (
    <div className={cn('flex items-center gap-1.5 p-1 bg-surface-card border border-border-subtle rounded-xl overflow-x-auto scrollbar-none', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap z-10 cursor-pointer',
              isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-brand-cyan rounded-lg -z-10 shadow-glow-cyan"
              />
            )}
            <span className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-surface-accent text-slate-300'
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

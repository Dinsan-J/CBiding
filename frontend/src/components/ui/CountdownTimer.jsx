import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const CountdownTimer = ({
  secondsRemaining = 30,
  totalSeconds = 30,
  size = 120,
  strokeWidth = 8,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress clamp between 0 and 1
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const strokeDashoffset = circumference - progress * circumference;

  // Determine urgency level
  const isUrgent = secondsRemaining <= 5 && secondsRemaining > 0;
  const isWarning = secondsRemaining > 5 && secondsRemaining <= 10;
  const isExpired = secondsRemaining <= 0;

  let strokeColor = '#06B6D4'; // brand-cyan
  let glowClass = 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]';
  let textColor = 'text-brand-cyan';

  if (isWarning) {
    strokeColor = '#F59E0B'; // brand-gold
    glowClass = 'drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    textColor = 'text-brand-gold';
  } else if (isUrgent || isExpired) {
    strokeColor = '#EF4444'; // brand-crimson
    glowClass = 'drop-shadow-[0_0_14px_rgba(239,68,68,0.8)]';
    textColor = 'text-brand-crimson';
  }

  // Format mm:ss
  const mins = Math.floor(secondsRemaining / 60);
  const secs = Math.max(0, secondsRemaining % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div 
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform overflow-visible"
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={cn('transition-colors duration-300', glowClass)}
        />
      </svg>

      {/* Center Digital Display */}
      <motion.div 
        animate={isUrgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={isUrgent ? { repeat: Infinity, duration: 0.8 } : undefined}
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
      >
        <span className={cn('font-mono font-extrabold tracking-tighter text-2xl leading-none', textColor)}>
          {formattedTime}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
          {isExpired ? 'EXPIRED' : 'REMAINING'}
        </span>
      </motion.div>
    </div>
  );
};

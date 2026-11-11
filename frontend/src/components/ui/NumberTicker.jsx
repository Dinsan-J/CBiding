import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Animated number ticker using Framer Motion spring interpolation
 */
export const NumberTicker = ({
  value = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatWithCommas = true
}) => {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current);
    const formatted = formatWithCommas ? rounded.toLocaleString() : rounded;
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
};

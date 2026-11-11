// Framer Motion spring presets and animation variants for CBid

export const springSnappy = {
  type: "spring",
  stiffness: 400,
  damping: 28,
  mass: 0.8
};

export const springGentle = {
  type: "spring",
  stiffness: 280,
  damping: 26,
  mass: 1
};

export const springBouncy = {
  type: "spring",
  stiffness: 340,
  damping: 18,
  mass: 0.9
};

// 1. Page Transitions
export const pageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 380, 
      damping: 30, 
      mass: 0.8 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.995,
    transition: { duration: 0.18, ease: "easeOut" } 
  }
};

// 2. Tab Content Cross-Fade Transition
export const tabContentVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.22, ease: [0.25, 1, 0.5, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -6, 
    transition: { duration: 0.15, ease: "easeIn" } 
  }
};

// 3. Accordion Height Expand / Collapse Transition
export const accordionVariants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  },
  expanded: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
  }
};

// 4. Stagger Container & Child Entrances
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: springSnappy
  }
};

// 5 & 6. Modal / Dialog Animations
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalScaleUp = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
      mass: 0.8
    }
  },
  exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.15 } }
};

// 7. Active Lot Entrance
export const lotEntranceVariants = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 26
    }
  },
  exit: { opacity: 0, scale: 0.97, y: -12, transition: { duration: 0.2 } }
};

// 9. SOLD Celebration Animation
export const soldBadgeVariant = {
  hidden: { scale: 2.2, opacity: 0, rotate: -15 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    rotate: -4,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 20
    }
  }
};

// 10. UNSOLD Animation
export const unsoldBadgeVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.25 }
  },
  exit: { opacity: 0, x: 50, transition: { duration: 0.2 } }
};

// 15. Hover Micro-Interactions
export const hoverLift = {
  hover: { 
    y: -3, 
    transition: { duration: 0.2, ease: "easeOut" } 
  }
};

// 16. Button Micro-Interactions
export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.96 }
};

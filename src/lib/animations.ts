import type { Variants, Transition } from 'framer-motion';

// ============================================
// EASING FUNCTIONS - Premium Curves
// ============================================
export const easings = {
  // Smooth deceleration - elegant entrances
  smooth: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Bouncy effect for playful interactions
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  // Elastic snap effect
  elastic: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  // Linear for continuous animations
  linear: [0, 0, 1, 1] as [number, number, number, number],
  // Sharp acceleration
  sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
  // Gentle ease
  gentle: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  // Dramatic entrance
  dramatic: [0.87, 0, 0.13, 1] as [number, number, number, number],
  // Spring-like
  spring: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
};

// ============================================
// TRANSITION PRESETS
// ============================================
export const transitions = {
  default: {
    duration: 0.6,
    ease: easings.smooth,
  } as Transition,
  fast: {
    duration: 0.3,
    ease: easings.sharp,
  } as Transition,
  slow: {
    duration: 1,
    ease: easings.gentle,
  } as Transition,
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  } as Transition,
};

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.default,
  },
};

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
};

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.default,
  },
};

export const scaleInUp: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 40,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
};

export const popIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
};

// ============================================
// ROTATION ANIMATIONS
// ============================================

export const rotateIn: Variants = {
  hidden: { 
    opacity: 0, 
    rotate: -15,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: transitions.spring,
  },
};

export const flipInX: Variants = {
  hidden: { 
    opacity: 0, 
    rotateX: 90,
  },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

export const flipInY: Variants = {
  hidden: { 
    opacity: 0, 
    rotateY: 90,
  },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const slowStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

export const cascadeContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      staggerDirection: 1,
    },
  },
};

// ============================================
// HOVER ANIMATIONS
// ============================================

export const cardHover = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: transitions.fast,
  },
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    transition: transitions.spring,
  },
};

export const buttonHover = {
  rest: { 
    scale: 1,
    boxShadow: '0 0 0 rgba(0,0,0,0)',
  },
  hover: { 
    scale: 1.05,
    boxShadow: '0 10px 40px -10px var(--accent-glow)',
    transition: transitions.spring,
  },
  tap: { 
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const iconHover = {
  rest: { 
    scale: 1, 
    rotate: 0,
  },
  hover: { 
    scale: 1.2, 
    rotate: 5,
    transition: transitions.bounce,
  },
};

export const glowHover = {
  rest: {
    boxShadow: '0 0 0px var(--accent-glow)',
  },
  hover: {
    boxShadow: '0 0 30px var(--accent-glow)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ============================================
// TEXT ANIMATIONS
// ============================================

export const revealText: Variants = {
  hidden: { 
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: '0%',
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

export const revealContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const typewriter: Variants = {
  hidden: { 
    width: 0,
    opacity: 1,
  },
  visible: {
    width: '100%',
    opacity: 1,
    transition: {
      duration: 1.5,
      ease: easings.linear,
    },
  },
};

export const characterReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
};

// ============================================
// SPECIAL EFFECTS
// ============================================

export const slideUp: Variants = {
  hidden: { 
    y: 100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { 
    y: '100%',
  },
  visible: {
    y: 0,
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
};

export const magneticPull = {
  rest: { x: 0, y: 0 },
  hover: (offset: { x: number; y: number }) => ({
    x: offset.x * 0.3,
    y: offset.y * 0.3,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 15,
    },
  }),
};

export const morphing: Variants = {
  hidden: {
    borderRadius: '10%',
    rotate: 0,
  },
  visible: {
    borderRadius: ['10%', '50%', '10%'],
    rotate: [0, 180, 360],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ============================================
// NAVIGATION ANIMATIONS
// ============================================

export const navVariants: Variants = {
  hidden: { 
    y: -100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1,
      ease: easings.smooth,
      delay: 0.2,
    },
  },
};

export const navItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
};

export const mobileMenuVariants: Variants = {
  closed: {
    opacity: 0,
    x: '100%',
    transition: {
      duration: 0.3,
      ease: easings.sharp,
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: easings.smooth,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ============================================
// CONTINUOUS ANIMATIONS (for animate prop)
// ============================================

export const floating = {
  y: [-10, 10, -10],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const floatingSlow = {
  y: [-15, 15, -15],
  x: [-5, 5, -5],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const pulse = {
  scale: [1, 1.05, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const pulseRing = {
  scale: [1, 1.5, 1.5],
  opacity: [0.5, 0, 0],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeOut' as const,
  },
};

export const spin = {
  rotate: 360,
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const spinSlow = {
  rotate: 360,
  transition: {
    duration: 60,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const shimmer = {
  backgroundPosition: ['-200% 0', '200% 0'],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const breathe = {
  scale: [1, 1.02, 1],
  opacity: [0.9, 1, 0.9],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const wiggle = {
  rotate: [-2, 2, -2],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ============================================
// SCROLL TRIGGERED ANIMATIONS
// ============================================

export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

export const scrollScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
};

export const parallaxUp: Variants = {
  hidden: { y: 100 },
  visible: {
    y: -100,
    transition: {
      duration: 1,
      ease: easings.linear,
    },
  },
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: easings.sharp,
    },
  },
};

export const curtainReveal: Variants = {
  initial: {
    clipPath: 'inset(0 100% 0 0)',
  },
  animate: {
    clipPath: 'inset(0 0% 0 0)',
    transition: {
      duration: 0.8,
      ease: easings.dramatic,
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const createStaggerDelay = (index: number, baseDelay: number = 0.1): number => {
  return index * baseDelay;
};

export const createSpringTransition = (
  stiffness: number = 300,
  damping: number = 30
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});

export const createDurationTransition = (
  duration: number = 0.6,
  ease: [number, number, number, number] = easings.smooth
): Transition => ({
  duration,
  ease,
});

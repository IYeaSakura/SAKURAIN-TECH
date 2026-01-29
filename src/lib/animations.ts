import type { Variants } from 'framer-motion';

// Easing functions - using tuple type for cubic bezier
export const easings = {
  smooth: [0.16, 1, 0.3, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  elastic: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
};

// Fade in from bottom
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
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

// Fade in from left
export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -40 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

// Fade in from right
export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 40 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

// Scale in
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
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

// Stagger container
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

// Fast stagger container
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

// Card hover animation - simplified
export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
};

// Button hover animation
export const buttonHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
  },
  tap: { scale: 0.98 },
};

// Reveal text animation (line by line)
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

// Reveal container for text lines
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

// Navigation animation
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

// Slide up animation for footer reveal
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

// Flip animation for stats
export const flipIn: Variants = {
  hidden: { 
    rotateX: 90,
    opacity: 0,
  },
  visible: {
    rotateX: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easings.smooth,
    },
  },
};

// Pulse animation for popular badges
export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Floating animation
export const floating = {
  y: [-10, 10, -10],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

import { type Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// Stagger container — children use staggerChildren
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Parallax helper — apply with useTransform/useScroll
export const parallaxConfig = {
  slow: 0.3,
  medium: 0.5,
  fast: 0.8,
};

// Glassmorphism hover effect
export const glassHover: Variants = {
  rest: { scale: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 40px rgba(180, 120, 60, 0.18)",
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Page transition
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

// Ambient float animation for particles/decorative elements
export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: "easeInOut",
  },
};

export const pulseAnimation = {
  scale: [1, 1.04, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 3,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: "easeInOut",
  },
};

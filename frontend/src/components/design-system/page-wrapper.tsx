"use client";

import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animations";
import { type ReactNode } from "react";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="min-h-screen"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

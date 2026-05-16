"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { glassHover } from "@/lib/animations";
import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, glow = false, onClick }: GlassCardProps) {
  return (
    <motion.div
      variants={hover ? glassHover : undefined}
      initial={hover ? "rest" : undefined}
      whileHover={hover ? "hover" : undefined}
      animate={hover ? "rest" : undefined}
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-6",
        glow && "ambient-glow",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

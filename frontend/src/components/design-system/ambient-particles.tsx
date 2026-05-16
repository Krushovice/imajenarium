"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface AmbientParticlesProps {
  count?: number;
  className?: string;
}

export function AmbientParticles({ count = 20, className }: AmbientParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 6 + 4,
        delay: Math.random() * 4,
        opacity: Math.random() * 0.4 + 0.1,
      }))
    );
  }, [count]);

  if (!mounted) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

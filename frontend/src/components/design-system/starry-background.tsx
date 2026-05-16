"use client";

import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  cycleDuration: number; // total cycle length ms
  visibleFraction: number; // 0-1, how much of cycle star is visible
  fadeInFraction: number; // fraction of visible time spent fading in
  phaseOffset: number; // where in cycle to start (ms)
}

// Deterministic pseudo-random from seed
function seededRand(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildStars(count: number, seed: number): Star[] {
  const rand = seededRand(seed);
  return Array.from({ length: count }, () => {
    const cycleDuration = rand() * 6000 + 4000; // 4–10s full cycle
    const visibleFraction = rand() * 0.35 + 0.15; // visible 15–50% of cycle
    return {
      x: rand(),
      y: rand(),
      size: rand() * 1.6 + 0.3,
      maxOpacity: rand() * 0.55 + 0.25,
      cycleDuration,
      visibleFraction,
      fadeInFraction: rand() * 0.3 + 0.2, // 20–50% of visible spent fading in
      phaseOffset: rand() * cycleDuration,
    };
  });
}

// Bright accent stars — fewer, bigger, more dramatic appearance
function buildBrightStars(count: number, seed: number): Star[] {
  const rand = seededRand(seed);
  return Array.from({ length: count }, () => {
    const cycleDuration = rand() * 8000 + 6000;
    const visibleFraction = rand() * 0.25 + 0.1;
    return {
      x: rand(),
      y: rand() * 0.7,
      size: rand() * 2.2 + 1.4,
      maxOpacity: rand() * 0.3 + 0.7,
      cycleDuration,
      visibleFraction,
      fadeInFraction: rand() * 0.25 + 0.25,
      phaseOffset: rand() * cycleDuration,
    };
  });
}

function getStarOpacity(star: Star, timestamp: number): number {
  const pos = ((timestamp + star.phaseOffset) % star.cycleDuration) / star.cycleDuration; // 0–1 in cycle

  const visibleEnd = star.visibleFraction;
  const fadeInEnd = star.visibleFraction * star.fadeInFraction;
  const fadeOutStart = star.visibleFraction * (1 - star.fadeInFraction);

  if (pos > visibleEnd) return 0; // invisible phase

  if (pos < fadeInEnd) {
    // fading in
    return (pos / fadeInEnd) * star.maxOpacity;
  } else if (pos < fadeOutStart) {
    // fully visible — subtle twinkle
    const twinkle = Math.sin((pos / star.visibleFraction) * Math.PI * 6) * 0.06;
    return Math.max(0, star.maxOpacity + twinkle);
  } else {
    // fading out
    const t = (pos - fadeOutStart) / (visibleEnd - fadeOutStart);
    return (1 - t) * star.maxOpacity;
  }
}

const STARS = buildStars(320, 42);
const BRIGHT_STARS = buildBrightStars(35, 137);

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (timestamp: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ── Sky gradient ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0,    "#0D0B18");
      skyGrad.addColorStop(0.35, "#12102A");
      skyGrad.addColorStop(0.65, "#1E1020");
      skyGrad.addColorStop(0.82, "#2A1210");
      skyGrad.addColorStop(0.92, "#4A1E08");
      skyGrad.addColorStop(1,    "#7A3010");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Milky Way soft glow ──
      const mwGlow = ctx.createRadialGradient(w * 0.52, h * 0.28, h * 0.05, w * 0.52, h * 0.28, h * 0.55);
      mwGlow.addColorStop(0,   "rgba(160, 120, 200, 0.13)");
      mwGlow.addColorStop(0.4, "rgba(100,  80, 160, 0.07)");
      mwGlow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = mwGlow;
      ctx.fillRect(0, 0, w, h);

      // Milky Way arc band
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 1.05, w * 0.82, h * 0.75, -0.18, 0, Math.PI * 2);
      const mwBand = ctx.createLinearGradient(0, h * 0.05, w, h * 0.6);
      mwBand.addColorStop(0,    "rgba(180,140,100,0)");
      mwBand.addColorStop(0.2,  "rgba(200,160,100,0.06)");
      mwBand.addColorStop(0.45, "rgba(220,180,130,0.12)");
      mwBand.addColorStop(0.55, "rgba(200,150,100,0.09)");
      mwBand.addColorStop(0.75, "rgba(160,100, 60,0.04)");
      mwBand.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = mwBand;
      ctx.fill();
      ctx.restore();

      // Nebula warm core
      const nebula = ctx.createRadialGradient(w * 0.62, h * 0.38, 0, w * 0.62, h * 0.38, w * 0.28);
      nebula.addColorStop(0,   "rgba(210,140,60,0.16)");
      nebula.addColorStop(0.3, "rgba(180,100,40,0.09)");
      nebula.addColorStop(0.6, "rgba(140, 60,20,0.03)");
      nebula.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      // ── Horizon glow ──
      const horizon = ctx.createLinearGradient(0, h * 0.78, 0, h);
      horizon.addColorStop(0,   "rgba(180, 80,20,0)");
      horizon.addColorStop(0.5, "rgba(200,100,30,0.17)");
      horizon.addColorStop(1,   "rgba(240,130,40,0.33)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, h * 0.78, w, h * 0.22);

      // ── Stars: appear/disappear ──
      const allStars = [...STARS, ...BRIGHT_STARS];
      for (const star of allStars) {
        const alpha = getStarOpacity(star, timestamp);
        if (alpha <= 0.01) continue;

        const sx = star.x * w;
        const sy = star.y * h;
        const warmness = star.y;
        const r = Math.round(220 + warmness * 35);
        const g = Math.round(215 + warmness * 10);
        const b = Math.round(200 - warmness * 60);

        // Glow halo for larger stars
        if (star.size > 1.8) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 4);
          glow.addColorStop(0, `rgba(255,235,190,${(alpha * 0.5).toFixed(3)})`);
          glow.addColorStop(1, "rgba(255,200,140,0)");
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}

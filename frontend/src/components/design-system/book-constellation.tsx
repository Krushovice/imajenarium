"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface BookConstellationProps {
  /** Overall brightness multiplier 0–1, default 1 */
  intensity?: number;
  /** Glow blur radius multiplier 0–2, default 1 */
  glow?: number;
  /** Shooting sparks count 0–10, default 7 */
  particleCount?: number;
  /** Animation speed multiplier 0.5–2, default 1 */
  animationSpeed?: number;
  /** Overall SVG opacity 0–1, default 1 */
  opacity?: number;
  /** Mouse parallax strength 0–1, default 0.6 */
  parallaxStrength?: number;
}

// Geometry — open book, V-spine at top, pages spread down-outward.
// DO NOT change x/y values — shape must match reference exactly.
const S = {
  north:  { x: 200, y: 22  },  // V-peak (spine top, brightest)
  spL:    { x: 165, y: 72  },  // V-arm left
  spR:    { x: 235, y: 72  },  // V-arm right
  ltOut:  { x: 45,  y: 108 },  // Left page top-outer corner
  lMid:   { x: 30,  y: 180 },  // Left outer edge mid
  lbOut:  { x: 45,  y: 250 },  // Left bottom outer corner
  lbMid:  { x: 118, y: 268 },  // Left bottom edge mid
  spBot:  { x: 200, y: 273 },  // Spine bottom (pages meet)
  lFold:  { x: 150, y: 174 },  // Left inner fold midpoint
  rtOut:  { x: 355, y: 108 },  // Right page top-outer corner
  rMid:   { x: 370, y: 180 },  // Right outer edge mid
  rbOut:  { x: 355, y: 250 },  // Right bottom outer corner
  rbMid:  { x: 282, y: 268 },  // Right bottom edge mid
  rFold:  { x: 250, y: 174 },  // Right inner fold midpoint
} as const;

type StarKey = keyof typeof S;

// Main structural lines (book outline + primary fold lines)
const EDGES: [StarKey, StarKey][] = [
  ["north", "spL"],
  ["north", "spR"],
  ["spL",   "ltOut"],
  ["ltOut", "lMid"],
  ["lMid",  "lbOut"],
  ["lbOut", "lbMid"],
  ["lbMid", "spBot"],
  ["spBot", "spL"],
  ["spL",   "lFold"],
  ["lFold", "spBot"],
  ["spR",   "rtOut"],
  ["rtOut", "rMid"],
  ["rMid",  "rbOut"],
  ["rbOut", "rbMid"],
  ["rbMid", "spBot"],
  ["spBot", "spR"],
  ["spR",   "rFold"],
  ["rFold", "spBot"],
];

// Second fold lines — dashed, dimmer, suggest page-block depth like the reference
const DEPTH_LINES: [number, number, number, number][] = [
  [158, 79,  143, 177],   // Left page: depth fold top-half
  [143, 177, 196, 271],   // Left page: depth fold bottom-half
  [242, 79,  257, 177],   // Right page: depth fold top-half (mirror)
  [257, 177, 204, 271],   // Right page: depth fold bottom-half (mirror)
];

const BRIGHT: Set<StarKey> = new Set(["north", "spL", "spR", "ltOut", "rtOut", "lbOut", "rbOut", "spBot"]);

const ALL_SPARKS: { from: StarKey; to: StarKey; delay: number; interval: number }[] = [
  { from: "north",  to: "spL",   delay: 0.8,  interval: 9  },
  { from: "north",  to: "spR",   delay: 3.2,  interval: 9  },
  { from: "spL",    to: "ltOut", delay: 1.6,  interval: 11 },
  { from: "spR",    to: "rtOut", delay: 5.0,  interval: 11 },
  { from: "spL",    to: "spBot", delay: 7.4,  interval: 14 },
  { from: "lbOut",  to: "spBot", delay: 2.5,  interval: 12 },
  { from: "rbOut",  to: "spBot", delay: 6.1,  interval: 12 },
  { from: "spR",    to: "rFold", delay: 4.3,  interval: 13 },
  { from: "ltOut",  to: "lbOut", delay: 9.2,  interval: 15 },
  { from: "rtOut",  to: "rbOut", delay: 11.0, interval: 15 },
];

function starAnim(i: number) {
  const h  = ((i * 6271 + 1009) & 0xffff) / 0xffff;
  const h2 = ((i * 9173 + 3571) & 0xffff) / 0xffff;
  return {
    dur:   2.4 + h  * 3.8,
    delay: h2 * 4.2,
    loMin: 0.30 + h  * 0.25,
    loMax: 0.80 + h2 * 0.20,
    rMin:  0.78,
    rMax:  1.40,
  };
}

export function BookConstellation({
  intensity = 1,
  glow = 1,
  particleCount = 7,
  animationSpeed = 1,
  opacity = 1,
  parallaxStrength = 0.6,
}: BookConstellationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReducedMotion]);

  const entries = Object.entries(S) as [StarKey, { x: number; y: number }][];
  const sparks  = ALL_SPARKS.slice(0, Math.max(0, Math.min(10, particleCount)));
  const speed   = animationSpeed > 0 ? animationSpeed : 1;
  const p       = prefersReducedMotion ? 0 : parallaxStrength;

  const tx = mouse.x * 10 * p;
  const ty = mouse.y *  7 * p;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity, scale: 1 }}
      transition={{ duration: 2.4, delay: 0.3, ease: "easeOut" }}
      className="pointer-events-none select-none"
    >
      <div
        style={{
          transform: `translate(${tx}px, ${ty}px)`,
          transition: "transform 0.55s cubic-bezier(0.25, 0.1, 0.25, 1)",
          willChange: p > 0 ? "transform" : undefined,
        }}
      >
        <svg
          viewBox="0 0 400 290"
          className="w-[min(70vw,480px)] mx-auto"
          style={{ overflow: "visible" }}
          fill="none"
        >
          <defs>
            {/* Tight bright glow for key stars */}
            <filter id="bc-gl-b" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={Math.max(0.1, 1.8 * glow)} result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Subtle glow for dim stars */}
            <filter id="bc-gl-d" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={Math.max(0.1, 0.9 * glow)} result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Spark trail glow */}
            <filter id="bc-gl-sp" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation={Math.max(0.1, 3.0 * glow)} result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Line glow layer */}
            <filter id="bc-gl-line" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation={Math.max(0.1, 1.2 * glow)} result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Page depth lines — dashed, suggests stacked pages like reference */}
          {DEPTH_LINES.map(([x1, y1, x2, y2], i) => (
            <line
              key={`d-${i}`}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke="#E8C880"
              strokeWidth="0.6"
              strokeOpacity={0.28 * intensity}
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          ))}

          {/* Main structural lines — glow copy beneath */}
          {EDGES.map(([a, b], i) => (
            <line
              key={`lg-${i}`}
              x1={S[a].x} y1={S[a].y}
              x2={S[b].x} y2={S[b].y}
              stroke="#D4A060"
              strokeWidth="2.0"
              strokeOpacity={0.12 * intensity}
              strokeLinecap="round"
              filter="url(#bc-gl-line)"
            />
          ))}

          {/* Main structural lines */}
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={S[a].x} y1={S[a].y}
              x2={S[b].x} y2={S[b].y}
              stroke="#EDD5A0"
              strokeWidth="1.0"
              strokeOpacity={0.70 * intensity}
              strokeLinecap="round"
            />
          ))}

          {/* Shooting sparks along constellation edges */}
          {!prefersReducedMotion && sparks.map((sp, i) => (
            <motion.circle
              key={`sp-${i}`}
              r={1.9}
              fill="#FFF8E0"
              filter="url(#bc-gl-sp)"
              initial={{ cx: S[sp.from].x, cy: S[sp.from].y, opacity: 0 }}
              animate={{
                cx:      [S[sp.from].x, S[sp.to].x],
                cy:      [S[sp.from].y, S[sp.to].y],
                opacity: [0, intensity, intensity, 0],
              }}
              transition={{
                duration:    0.48 / speed,
                delay:       sp.delay,
                repeat:      Infinity,
                repeatDelay: sp.interval / speed,
                ease:        "easeInOut",
              }}
            />
          ))}

          {/* Stars */}
          {entries.map(([id, pos], i) => {
            const bright     = BRIGHT.has(id);
            const a          = starAnim(i);
            const baseR      = bright ? 2.4 : 1.2;
            // Tight halo — max 2× core radius so stars look sharp not blobby
            const haloR      = baseR * (bright ? 2.2 : 1.8);
            const glowFill   = bright ? "#FFE8A0" : "#D4A860";
            const coreFill   = bright ? "#FFFEF8" : "#F5E8CC";
            const glowFilter = bright ? "url(#bc-gl-b)" : "url(#bc-gl-d)";

            return (
              <g key={id}>
                {/* Small tight halo — breathing glow */}
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={haloR}
                  fill={glowFill}
                  animate={prefersReducedMotion ? {} : {
                    r: [
                      haloR * 0.85,
                      haloR * (bright ? 1.4 : 1.25),
                      haloR * 0.85,
                    ],
                    fillOpacity: [
                      (bright ? 0.22 : 0.08) * intensity,
                      (bright ? 0.45 : 0.18) * intensity,
                      (bright ? 0.22 : 0.08) * intensity,
                    ],
                  }}
                  transition={{
                    duration:   a.dur / speed,
                    delay:      a.delay,
                    repeat:     Infinity,
                    repeatType: "loop",
                    ease:       "easeInOut",
                  }}
                />

                {/* Star core — sharp, bright, with filter glow */}
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={baseR}
                  fill={coreFill}
                  filter={glowFilter}
                  animate={prefersReducedMotion ? {} : {
                    opacity: [
                      (a.loMin * 0.6 + 0.3) * intensity,
                      intensity,
                      (a.loMin * 0.6 + 0.3) * intensity,
                    ],
                    r: [baseR * 0.9, baseR * 1.15, baseR * 0.9],
                  }}
                  transition={{
                    duration:   a.dur / speed,
                    delay:      a.delay,
                    repeat:     Infinity,
                    repeatType: "loop",
                    ease:       "easeInOut",
                  }}
                />

                {/* Cross-spike for bright anchor stars */}
                {bright && (
                  <motion.g
                    animate={prefersReducedMotion ? {} : {
                      opacity: [0.4 * intensity, 0.9 * intensity, 0.4 * intensity],
                    }}
                    transition={{
                      duration:   a.dur / speed,
                      delay:      a.delay,
                      repeat:     Infinity,
                      repeatType: "loop",
                      ease:       "easeInOut",
                    }}
                  >
                    <line x1={pos.x - 5} y1={pos.y} x2={pos.x + 5} y2={pos.y}
                      stroke="#FFFEF8" strokeWidth="0.5" strokeLinecap="round"/>
                    <line x1={pos.x} y1={pos.y - 5} x2={pos.x} y2={pos.y + 5}
                      stroke="#FFFEF8" strokeWidth="0.5" strokeLinecap="round"/>
                  </motion.g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Phase = 1 | 2 | 3 | 5;
type StarSize = "major" | "minor" | "accent" | "spine";
type LineType = "spine" | "primary" | "secondary" | "fold" | "text" | "spineconn";

interface StarDef {
  id: string;
  x: number;
  y: number;
  size: StarSize;
  mobileHidden?: boolean;
}

interface ConnDef {
  from?: string;
  to?: string;
  type: LineType;
  x1?: number; y1?: number;
  x2?: number; y2?: number;
  cpx?: number; cpy?: number;
  width?: number;
}

// ── viewBox matches perspective v1 SVG: 680×560 ──────────────────────────────
const VB_W = 680;
const VB_H = 560;

const CINEMATIC_EASE = [0.25, 0, 0.35, 1] as const;
const STAR_R: Record<StarSize, number> = { major: 3.8, minor: 2.4, accent: 1.4, spine: 5.2 };
const GLOW_R: Record<StarSize, number> = { major: 16,  minor: 10,  accent: 5,   spine: 24  };
const DEPTH_Y = [-1.4, -2.0, -1.0, -2.4, -1.7, -1.2];

// ── Stars — coordinates from perspective v1 SVG ───────────────────────────────
const STARS: StarDef[] = [
  // spine top & base
  { id: "sv",    x: 340, y: 119, size: "spine" },
  { id: "sb",    x: 340, y: 306, size: "spine" },

  // top-left diagonal
  { id: "tl-m",  x: 200, y: 131, size: "minor" },
  { id: "tl",    x: 95,  y: 143, size: "major" },

  // top-right diagonal
  { id: "tr-m",  x: 480, y: 135, size: "minor" },
  { id: "tr",    x: 585, y: 139, size: "major" },

  // outer bottom corners
  { id: "bl",    x: 70,  y: 402, size: "major" },
  { id: "br",    x: 610, y: 395, size: "major" },

  // left stack top
  { id: "ls1-t", x: 122, y: 155, size: "minor"  },
  { id: "ls2-t", x: 148, y: 170, size: "accent" },
  // left stack mid
  { id: "ls1-m", x: 109, y: 278, size: "minor"  },
  { id: "ls2-m", x: 135, y: 283, size: "accent" },
  // left stack bottom
  { id: "ls1-b", x: 96,  y: 398, size: "minor"  },
  { id: "ls2-b", x: 122, y: 394, size: "accent" },

  // right stack top
  { id: "rs1-t", x: 558, y: 151, size: "minor"  },
  { id: "rs2-t", x: 532, y: 165, size: "accent" },
  // right stack mid
  { id: "rs1-m", x: 571, y: 272, size: "minor"  },
  { id: "rs2-m", x: 545, y: 278, size: "accent" },
  // right stack bottom
  { id: "rs1-b", x: 584, y: 391, size: "minor"  },
  { id: "rs2-b", x: 558, y: 387, size: "accent" },

  // left fan midpoints
  { id: "lf1-m", x: 198, y: 374, size: "minor"  },
  { id: "lf2-m", x: 220, y: 364, size: "accent" },
  { id: "lf3-m", x: 242, y: 354, size: "accent" },

  // right fan midpoints
  { id: "rf1-m", x: 482, y: 370, size: "minor"  },
  { id: "rf2-m", x: 460, y: 360, size: "accent" },
  { id: "rf3-m", x: 438, y: 350, size: "accent" },

  // text line stars LEFT
  { id: "tl1-a", x: 178, y: 208, size: "accent" },
  { id: "tl1-b", x: 308, y: 176, size: "accent" },
  { id: "tl2-a", x: 178, y: 252, size: "accent" },
  { id: "tl2-b", x: 248, y: 234, size: "accent" },
  { id: "tl3-a", x: 178, y: 298, size: "accent" },
  { id: "tl3-b", x: 278, y: 272, size: "accent" },

  // text line stars RIGHT
  { id: "tr1-a", x: 372, y: 210, size: "accent" },
  { id: "tr1-b", x: 502, y: 244, size: "accent" },
  { id: "tr2-a", x: 392, y: 260, size: "accent" },
  { id: "tr2-b", x: 502, y: 288, size: "accent" },
  { id: "tr3-a", x: 372, y: 306, size: "accent" },
  { id: "tr3-b", x: 472, y: 332, size: "accent" },

  // atmosphere
  { id: "a1", x: 82,  y: 22,  size: "accent" },
  { id: "a2", x: 220, y: 14,  size: "accent" },
  { id: "a3", x: 460, y: 18,  size: "accent" },
  { id: "a4", x: 598, y: 30,  size: "accent" },
  { id: "a5", x: 50,  y: 490, size: "accent", mobileHidden: true },
  { id: "a6", x: 630, y: 480, size: "accent", mobileHidden: true },
];

// ── Connections — verbatim from perspective v1 SVG ────────────────────────────
const CONNS: ConnDef[] = [
  // top-left diagonal
  { from: "sv",    to: "tl-m",  type: "primary",   width: 1.1 },
  { from: "tl-m",  to: "tl",    type: "primary",   width: 1.1 },
  // top-right diagonal
  { from: "sv",    to: "tr-m",  type: "primary",   width: 1.1 },
  { from: "tr-m",  to: "tr",    type: "primary",   width: 1.1 },

  // outer verticals
  { from: "tl",    to: "bl",    type: "primary",   width: 1.1 },
  { from: "tr",    to: "br",    type: "primary",   width: 1.1 },

  // left stack verticals
  { from: "ls1-t", to: "ls1-b", type: "secondary", width: 0.8 },
  { from: "ls2-t", to: "ls2-b", type: "fold",      width: 0.6 },
  // left stack top connectors
  { from: "tl",    to: "ls1-t", type: "secondary", width: 0.8 },
  { from: "ls1-t", to: "ls2-t", type: "fold",      width: 0.6 },
  // left stack bottom connectors
  { from: "bl",    to: "ls1-b", type: "secondary", width: 0.8 },
  { from: "ls1-b", to: "ls2-b", type: "fold",      width: 0.6 },

  // right stack verticals
  { from: "rs1-t", to: "rs1-b", type: "secondary", width: 0.8 },
  { from: "rs2-t", to: "rs2-b", type: "fold",      width: 0.6 },
  // right stack top connectors
  { from: "tr",    to: "rs1-t", type: "secondary", width: 0.8 },
  { from: "rs1-t", to: "rs2-t", type: "fold",      width: 0.6 },
  // right stack bottom connectors
  { from: "br",    to: "rs1-b", type: "secondary", width: 0.8 },
  { from: "rs1-b", to: "rs2-b", type: "fold",      width: 0.6 },

  // bottom fans LEFT (curved — ctrl points from SVG)
  { from: "bl",    to: "sb",    type: "primary",   cpx: 172, cpy: 340, width: 1.1 },
  { from: "ls1-b", to: "sb",    type: "secondary", cpx: 196, cpy: 338, width: 0.8 },
  { from: "ls2-b", to: "sb",    type: "fold",      cpx: 220, cpy: 336, width: 0.6 },

  // bottom fans RIGHT
  { from: "br",    to: "sb",    type: "primary",   cpx: 508, cpy: 334, width: 1.1 },
  { from: "rs1-b", to: "sb",    type: "secondary", cpx: 484, cpy: 330, width: 0.8 },
  { from: "rs2-b", to: "sb",    type: "fold",      cpx: 460, cpy: 328, width: 0.6 },

  // text lines LEFT
  { x1: 178, y1: 208, x2: 308, y2: 176, type: "text", width: 0.7 },
  { x1: 178, y1: 252, x2: 248, y2: 234, type: "text", width: 0.7 },
  { x1: 178, y1: 298, x2: 278, y2: 272, type: "text", width: 0.7 },

  // text lines RIGHT
  { x1: 372, y1: 210, x2: 502, y2: 244, type: "text", width: 0.7 },
  { x1: 392, y1: 260, x2: 502, y2: 288, type: "text", width: 0.7 },
  { x1: 372, y1: 306, x2: 472, y2: 332, type: "text", width: 0.7 },
];

const LINE_ALPHA: Record<LineType, number> = {
  spineconn: 0.98,
  spine:     0.95,
  primary:   0.85,
  secondary: 0.50,
  fold:      0.32,
  text:      0.48,
};
const LINE_RGB: Record<LineType, string> = {
  spineconn: "255, 248, 230",
  spine:     "210, 228, 255",
  primary:   "210, 228, 255",
  secondary: "185, 210, 255",
  fold:      "165, 195, 255",
  text:      "185, 210, 255",
};

const PHASE_MS = { drift: 1800, lines: 4400, idle: 8200 } as const;

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildPath(
  A: { x: number; y: number },
  B: { x: number; y: number },
  cpx?: number,
  cpy?: number,
): string {
  const cx = cpx ?? (A.x + B.x) / 2;
  const cy = cpy ?? (A.y + B.y) / 2;
  return `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`;
}

export default function BookConstellation() {
  const [mounted,  setMounted]  = useState(false);
  const [phase,    setPhase]    = useState<Phase>(1);
  const [isMobile, setIsMobile] = useState(false);
  const [scatter,  setScatter]  = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const rand = seededRand(99);
    const map: Record<string, { x: number; y: number }> = {};
    for (const s of STARS) map[s.id] = { x: rand() * VB_W, y: rand() * VB_H };
    setScatter(map);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t1 = setTimeout(() => setPhase(2), PHASE_MS.drift);
    const t2 = setTimeout(() => setPhase(3), PHASE_MS.lines);
    const t3 = setTimeout(() => setPhase(5), PHASE_MS.idle);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [mounted]);

  const starMap = useMemo(() => Object.fromEntries(STARS.map(s => [s.id, s])), []);

  const particles = useMemo(() => {
    const rand = seededRand(77);
    const count = isMobile ? 8 : 18;
    return Array.from({ length: count }, (_, i) => ({
      id: i, x: rand() * VB_W, y: rand() * VB_H,
      r: rand() * 1.0 + 0.3, dur: rand() * 5 + 6,
      del: rand() * 4, dy: -(rand() * 16 + 8),
    }));
  }, [isMobile]);

  if (!mounted) return null;

  const visibleStars = STARS.filter(s => !(isMobile && s.mobileHidden));
  const isIdle = phase === 5;

  return (
    <div className="pointer-events-none select-none" style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <filter id="bc-gl" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bc-gs" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bc-lg" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* userSpaceOnUse: абсолютные координаты — фикс для вертикальных линий с нулевым bbox по ширине */}
          <filter id="bc-spine" filterUnits="userSpaceOnUse" x="310" y="90" width="60" height="240">
            <feGaussianBlur stdDeviation="5.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Lines ── */}
        {phase >= 3 && CONNS.map((c, i) => {
          const alpha = LINE_ALPHA[c.type];
          const rgb   = LINE_RGB[c.type];
          const w     = c.width ?? 1.0;
          const delay = (i / CONNS.length) * 2.8;

          if (c.x1 !== undefined) {
            const d = `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
            return (
              <motion.path
                key={`seg-${i}`}
                d={d} fill="none"
                stroke={`rgba(${rgb}, ${alpha})`}
                strokeWidth={w} strokeLinecap="round"
                filter={c.type === "spineconn" ? "url(#bc-gl)" : "url(#bc-lg)"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isIdle ? [alpha * 0.6, alpha * 1.35, alpha * 0.6] : alpha }}
                transition={{
                  pathLength: { duration: 1.6, delay, ease: CINEMATIC_EASE },
                  opacity: isIdle
                    ? { duration: 5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }
                    : { duration: 0.5, delay },
                }}
              />
            );
          }

          const A = starMap[c.from!];
          const B = starMap[c.to!];
          if (!A || !B) return null;
          const d = buildPath(A, B, c.cpx, c.cpy);
          return (
            <motion.path
              key={`${c.from}-${c.to}-${i}`}
              d={d} fill="none"
              stroke={`rgba(${rgb}, ${alpha})`}
              strokeWidth={w} strokeLinecap="round"
              filter={c.type === "spineconn" ? "url(#bc-gl)" : "url(#bc-lg)"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isIdle ? [alpha * 0.6, alpha * 1.35, alpha * 0.6] : alpha }}
              transition={{
                pathLength: { duration: 2.2, delay, ease: CINEMATIC_EASE },
                opacity: isIdle
                  ? { duration: 5 + i * 0.35, repeat: Infinity, ease: "easeInOut", delay: i * 0.28 }
                  : { duration: 0.5, delay },
              }}
            />
          );
        })}

        {/* ── Stars ── */}
        {visibleStars.map((star, i) => {
          const sp     = scatter[star.id] ?? { x: VB_W / 2, y: VB_H / 2 };
          const r      = STAR_R[star.size];
          const gr     = GLOW_R[star.size];
          const dDelay = (i / visibleStars.length) * 1.5;
          const filtId = (star.size === "major" || star.size === "spine") ? "bc-gl" : "bc-gs";
          const depthY = DEPTH_Y[i % DEPTH_Y.length];
          return (
            <motion.g key={star.id}
              animate={isIdle ? { y: [0, depthY, 0] } : { y: 0 }}
              transition={isIdle
                ? { y: { duration: 6 + (i % 5) * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 } }
                : { y: { duration: 0 } }}
            >
              <motion.circle r={gr} fill="rgba(215,225,255,0.055)"
                initial={{ cx: sp.x, cy: sp.y, opacity: 0 }}
                animate={{
                  cx: phase >= 2 ? star.x : sp.x,
                  cy: phase >= 2 ? star.y : sp.y,
                  opacity: isIdle ? [0.04, 0.15, 0.04] : phase >= 2 ? 0.07 : 0,
                }}
                transition={isIdle
                  ? { cx: { duration: 0 }, cy: { duration: 0 },
                      opacity: { duration: 4.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.38 } }
                  : { cx: { duration: 3.5, delay: dDelay, ease: CINEMATIC_EASE },
                      cy: { duration: 3.5, delay: dDelay, ease: CINEMATIC_EASE },
                      opacity: { duration: 1.2, delay: dDelay } }}
              />
              <motion.circle
                r={r}
                fill={star.size === "spine" ? "rgba(255,248,230,1.0)" : "rgba(238,244,255,0.94)"}
                filter={`url(#${filtId})`}
                initial={{ cx: sp.x, cy: sp.y, opacity: 0.12, scale: 0.35 }}
                animate={{
                  cx: phase >= 2 ? star.x : sp.x,
                  cy: phase >= 2 ? star.y : sp.y,
                  opacity: star.size === "spine"
                    ? (isIdle ? [0.82, 1.0, 0.82] : phase >= 2 ? 1.0 : 0.18)
                    : (isIdle ? [0.62, 1.0, 0.62] : phase >= 2 ? 0.90 : 0.18),
                  scale: isIdle ? [1, 1.18, 1] : phase >= 2 ? 1 : 0.35,
                }}
                transition={isIdle
                  ? { cx: { duration: 0 }, cy: { duration: 0 },
                      opacity: { duration: 3.8 + i * 0.27, repeat: Infinity, ease: "easeInOut", delay: i * 0.24 },
                      scale:   { duration: 5   + i * 0.21, repeat: Infinity, ease: "easeInOut", delay: i * 0.19 } }
                  : { cx: { duration: 3.5, delay: dDelay, ease: CINEMATIC_EASE },
                      cy: { duration: 3.5, delay: dDelay, ease: CINEMATIC_EASE },
                      opacity: { duration: 1.2, delay: dDelay },
                      scale:   { duration: 1.2, delay: dDelay } }}
              />
            </motion.g>
          );
        })}

        {/* ── Cosmic dust ── */}
        {phase >= 3 && particles.map(p => (
          <motion.circle key={`fd-${p.id}`} r={p.r} fill="rgba(218,205,172,0.45)"
            initial={{ cx: p.x, cy: p.y, opacity: 0 }}
            animate={{ cx: p.x, cy: [p.y, p.y + p.dy, p.y], opacity: [0, 0.28, 0] }}
            transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* ── Central spine — rendered last (on top), opacity-only, no pathLength ── */}
        {phase >= 3 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: isIdle ? [0.55, 0.80, 0.55] : 0.75 }}
            transition={isIdle
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.8 }}
          >
            <line
              x1={starMap["sv"].x} y1={starMap["sv"].y}
              x2={starMap["sb"].x} y2={starMap["sb"].y}
              stroke="rgba(220, 232, 255, 0.65)"
              strokeWidth={6}
              strokeLinecap="round"
              filter="url(#bc-spine)"
            />
          </motion.g>
        )}
      </svg>
    </div>
  );
}

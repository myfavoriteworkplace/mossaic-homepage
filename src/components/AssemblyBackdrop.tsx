import { useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────────────
 * AssemblyBackdrop
 *
 * A fixed, full-viewport SVG that renders the Mossaic mosaic-M logo as an
 * ambient watermark. Each tile, breakaway shard, and the central AI core is
 * positioned off-screen (top-right) at the top of the page and "docks" into
 * its final slot as the user scrolls. When the user reaches the bottom, the
 * full mark is assembled and the core glows softly.
 *
 * - Reuses the exact geometry from src/components/Logo.tsx so the assembled
 *   result matches the brand mark perfectly.
 * - Pure SVG transforms + opacity (GPU-friendly), driven by a single
 *   useScroll() listener.
 * - pointer-events: none, low opacity, sits behind page content.
 * - Honors prefers-reduced-motion: shows the mark fully assembled, no flight.
 * ────────────────────────────────────────────────────────────────────────── */

const PATTERN = [
  "1100000000011",
  "1110000000111",
  "1111000001111",
  "1101100011011",
  "1100110110011",
  "1100011100011",
  "1100001000011",
  "1100000000011",
  "1100000000011",
  "1100000000011",
  "1100000000011",
];
const CELL = 4;
const COLS = 13;
const ROWS = 11;
const X0 = -((COLS * CELL) / 2);
const Y0 = -((ROWS * CELL) / 2);

const BREAKAWAY_CELLS = new Set(["0-12", "0-11", "1-12"]);
const BREAKAWAY_OFFSETS: Record<string, [number, number]> = {
  "0-12": [2.8, -2.2],
  "0-11": [1.4, -2.6],
  "1-12": [2.2, -0.6],
};

const flatHexPts = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
};

type TriTile = {
  cellKey: string;
  pts: string;
  shade: "primary" | "soft";
  /** Final centroid (used to sort docking order). */
  cx: number;
  cy: number;
  /** Final translation offset (breakaways only). */
  finalOffset: [number, number];
  /** Scattered start translation (off-canvas top-right). */
  scatter: [number, number];
  /** Scroll-progress window when this tile travels and docks. */
  start: number;
  end: number;
  /** Frame tiles (outer columns) are always present — they don't animate. */
  isFrame: boolean;
};

/** Outer-frame columns of the M (the two vertical legs). These are always
 * present at the top of the page so the M's silhouette is recognizable
 * before the inner V-junction starts assembling. */
const FRAME_COLS = new Set([0, 1, 11, 12]);

/**
 * Deterministic scatter — biased toward off-screen top-right, with a wide
 * angular spread so tiles don't appear to come from a single point.
 * SVG y is positive downward, so "up" = negative y.
 */
function scatterFor(idx: number): [number, number] {
  // Golden-angle pseudo-random distribution
  const t = idx * 2.39996;
  // Angle range: -75° (high-right) to -10° (right). Negative y in SVG = up.
  const angleDeg = -75 + ((idx * 13) % 65);
  const angle = (angleDeg * Math.PI) / 180;
  // Radius is moderate so tiles enter the visible area while still
  // clearly "flying in" from the upper-right, not popping at their slot.
  const radius = 45 + ((idx * 9) % 35); // 45 – 80 SVG units away
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  // Small jitter so they don't lie on a perfect arc
  const jx = Math.cos(t) * 5;
  const jy = Math.sin(t * 1.7) * 5;
  return [x + jx, y + jy];
}

export default function AssemblyBackdrop() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // ── Build tile list once ─────────────────────────────────────────────────
  const { tiles, corePts, pins, coreCx, coreCy } = useMemo(() => {
    const rawTiles: Omit<TriTile, "start" | "end">[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (PATTERN[r][c] !== "1") continue;
        const x = X0 + c * CELL;
        const y = Y0 + r * CELL;
        const x2 = x + CELL;
        const y2 = y + CELL;
        const cellKey = `${r}-${c}`;
        const altDir = (c + r) % 2 === 0;

        const isFrame = FRAME_COLS.has(c) && !BREAKAWAY_CELLS.has(cellKey);
        const finalOffset: [number, number] = BREAKAWAY_CELLS.has(cellKey)
          ? BREAKAWAY_OFFSETS[cellKey]
          : [0, 0];

        const cx = x + CELL / 2 + finalOffset[0];
        const cy = y + CELL / 2 + finalOffset[1];

        const idx = rawTiles.length;
        if (altDir) {
          rawTiles.push({
            cellKey,
            pts: `${x},${y} ${x2},${y} ${x},${y2}`,
            shade: "primary",
            cx,
            cy,
            finalOffset,
            scatter: scatterFor(idx),
            isFrame,
          });
          rawTiles.push({
            cellKey,
            pts: `${x2},${y} ${x2},${y2} ${x},${y2}`,
            shade: "soft",
            cx,
            cy,
            finalOffset,
            scatter: scatterFor(idx + 1),
            isFrame,
          });
        } else {
          rawTiles.push({
            cellKey,
            pts: `${x},${y} ${x2},${y} ${x2},${y2}`,
            shade: "soft",
            cx,
            cy,
            finalOffset,
            scatter: scatterFor(idx),
            isFrame,
          });
          rawTiles.push({
            cellKey,
            pts: `${x},${y} ${x2},${y2} ${x},${y2}`,
            shade: "primary",
            cx,
            cy,
            finalOffset,
            scatter: scatterFor(idx + 1),
            isFrame,
          });
        }
      }
    }

    // Three groups, each with its own docking phase:
    //  - frame: always present, no animation needed
    //  - inner: V-junction tiles, fly in during main scroll
    //  - breakaways: dock last, just before the core
    const frame: typeof rawTiles = [];
    const inner: typeof rawTiles = [];
    const breakers: typeof rawTiles = [];
    for (const t of rawTiles) {
      if (BREAKAWAY_CELLS.has(t.cellKey)) breakers.push(t);
      else if (t.isFrame) frame.push(t);
      else inner.push(t);
    }
    // Inner tiles dock outside-in: tiles farther from the V-center first,
    // tiles closest to the center (final lock-in) last.
    inner.sort(
      (a, b) =>
        Math.hypot(b.cx, b.cy - 6) - Math.hypot(a.cx, a.cy - 6),
    );

    const ASSEMBLY_START = 0.08;
    const ASSEMBLY_END = 0.62;
    const TILE_DURATION = 0.20;
    const BREAK_START = 0.62;
    const BREAK_END = 0.82;
    const BREAK_DURATION = 0.16;

    const finalTiles: TriTile[] = [];
    // Frame tiles — no animation window needed; render at final position.
    frame.forEach((t) => {
      finalTiles.push({ ...t, start: 0, end: 0 });
    });
    inner.forEach((t, k) => {
      const span = ASSEMBLY_END - ASSEMBLY_START - TILE_DURATION;
      const start =
        inner.length > 1
          ? ASSEMBLY_START + (k / (inner.length - 1)) * span
          : ASSEMBLY_START;
      finalTiles.push({ ...t, start, end: start + TILE_DURATION });
    });
    breakers.forEach((t, k) => {
      const span = BREAK_END - BREAK_START - BREAK_DURATION;
      const start =
        breakers.length > 1
          ? BREAK_START + (k / (breakers.length - 1)) * span
          : BREAK_START;
      finalTiles.push({ ...t, start, end: start + BREAK_DURATION });
    });

    // Core
    const coreCx = 0;
    const coreCy = 6;
    const coreR = 5.2;
    const apothem = coreR * Math.cos(Math.PI / 6);
    const corePts = flatHexPts(coreCx, coreCy, coreR);
    const pinLen = 1.9;
    const pins: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (Math.PI / 3) * i;
      pins.push({
        x1: coreCx + apothem * Math.cos(a),
        y1: coreCy + apothem * Math.sin(a),
        x2: coreCx + (apothem + pinLen) * Math.cos(a),
        y2: coreCy + (apothem + pinLen) * Math.sin(a),
      });
    }

    return { tiles: finalTiles, corePts, pins, coreCx, coreCy };
  }, []);

  // Core fade-in window: starts after breakaways finish, fully on by 0.95.
  const coreOpacity = useTransform(scrollYProgress, [0.78, 0.95], [0, 1]);
  // Glow ramps up alongside the core, then breathes via CSS.
  const glowOpacity = useTransform(scrollYProgress, [0.82, 1.0], [0, 0.9]);
  // Pin extension — pins draw outward as the system "activates".
  const pinScale = useTransform(scrollYProgress, [0.85, 1.0], [0, 1]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: -1,
        // Soft radial vignette so the brightest area doesn't sit dead-center
        // under headlines.
        WebkitMaskImage:
          "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,1) 100%)",
        maskImage:
          "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,1) 100%)",
      }}
    >
      <svg
        viewBox="-30 -30 60 60"
        width="min(78vmin, 880px)"
        height="min(78vmin, 880px)"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          overflow: "visible",
          opacity: 0.18,
          mixBlendMode: "screen",
        }}
      >
        <defs>
          <linearGradient
            id="abTilePrim"
            x1="0"
            y1="-22"
            x2="0"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient
            id="abTileSoft"
            x1="0"
            y1="-22"
            x2="0"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#60A5FA" stopOpacity="0.95" />
            <stop offset="1" stopColor="#1D4ED8" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient
            id="abCore"
            x1="0"
            y1="0"
            x2="0"
            y2="12"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#A5F3FC" />
            <stop offset="0.5" stopColor="#22D3EE" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <radialGradient
            id="abGlow"
            cx={coreCx}
            cy={coreCy}
            r="14"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#22D3EE" stopOpacity="0.7" />
            <stop offset="0.55" stopColor="#22D3EE" stopOpacity="0.18" />
            <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
          <filter
            id="abBlur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* Core glow halo — fades in last */}
        <motion.circle
          cx={coreCx}
          cy={coreCy}
          r="14"
          fill="url(#abGlow)"
          style={{ opacity: reduced ? 0.9 : glowOpacity }}
        />

        <g strokeLinejoin="round">
          {tiles.map((t, i) => (
            <Tile
              key={i}
              tile={t}
              progress={scrollYProgress}
              reduced={!!reduced}
            />
          ))}
        </g>

        {/* Core hex (soft blur layer) */}
        <motion.polygon
          points={corePts}
          fill="url(#abCore)"
          filter="url(#abBlur)"
          style={{ opacity: reduced ? 0.6 : coreOpacity }}
        />

        {/* IC pins — extend outward as system "activates" */}
        <g>
          {pins.map((p, i) => (
            <motion.line
              key={i}
              x1={coreCx}
              y1={coreCy}
              x2={p.x2.toFixed(2)}
              y2={p.y2.toFixed(2)}
              stroke="#A5F3FC"
              strokeWidth="0.95"
              strokeLinecap="round"
              opacity="0.9"
              style={{
                pathLength: reduced ? 1 : pinScale,
                scale: reduced ? 1 : pinScale,
                transformOrigin: `${coreCx}px ${coreCy}px`,
              }}
            />
          ))}
        </g>

        {/* Core hex (crisp top layer) */}
        <motion.polygon
          points={corePts}
          fill="url(#abCore)"
          stroke="#A5F3FC"
          strokeWidth="0.55"
          strokeLinejoin="round"
          style={{ opacity: reduced ? 1 : coreOpacity }}
        >
          {!reduced && (
            <animate
              attributeName="opacity"
              values="1; 0.78; 1"
              dur="3.2s"
              repeatCount="indefinite"
              begin="6s"
            />
          )}
        </motion.polygon>

        {/* Inner core ring */}
        <motion.polygon
          points={flatHexPts(coreCx, coreCy, 5.2 * 0.55)}
          fill="none"
          stroke="#0E7490"
          strokeWidth="0.45"
          style={{ opacity: reduced ? 0.75 : coreOpacity }}
        />
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Tile({
  tile,
  progress,
  reduced,
}: {
  tile: TriTile;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  // Travel: from scattered offset → final offset, clamped within the window.
  const tx = useTransform(
    progress,
    [tile.start, tile.end],
    [tile.scatter[0], tile.finalOffset[0]],
    { clamp: true },
  );
  const ty = useTransform(
    progress,
    [tile.start, tile.end],
    [tile.scatter[1], tile.finalOffset[1]],
    { clamp: true },
  );
  // Fade in slightly faster than the travel, so a tile becomes visible
  // ~25% into its journey.
  const op = useTransform(
    progress,
    [
      tile.start,
      tile.start + (tile.end - tile.start) * 0.25,
      tile.end,
    ],
    [0, 0.6, tile.shade === "primary" ? 0.96 : 0.88],
    { clamp: true },
  );

  const fill =
    tile.shade === "primary" ? "url(#abTilePrim)" : "url(#abTileSoft)";

  if (reduced || tile.isFrame) {
    // Frame tiles are always present; reduced-motion users see everything
    // pre-assembled at low opacity.
    return (
      <polygon
        points={tile.pts}
        fill={fill}
        stroke="#1E40AF"
        strokeWidth="0.35"
        opacity={tile.shade === "primary" ? 0.96 : 0.88}
        transform={`translate(${tile.finalOffset[0]} ${tile.finalOffset[1]})`}
      />
    );
  }

  return (
    <motion.polygon
      points={tile.pts}
      fill={fill}
      stroke="#1E40AF"
      strokeWidth="0.35"
      style={{ x: tx, y: ty, opacity: op }}
    />
  );
}

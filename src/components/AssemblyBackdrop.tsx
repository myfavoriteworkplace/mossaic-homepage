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
 * ambient watermark by slicing the production master image
 * (/brand/mossaic-mark-512.png) into hexagonal regions. Each hex is a
 * separate <image> element clipped to its own hex slot, so the full image
 * acts as the source artwork — every flying piece is the *real* logo art,
 * not an approximation.
 *
 * Scroll-driven assembly stages:
 *   - 0.00          frame hexes (the M's outer legs) are already in place
 *   - 0.08 → 0.62   inner column hexes fly in from upper-right
 *   - 0.62 → 0.82   breakaway shards snap into place
 *   - 0.78 → 1.00   the central glowing AI-core hex fades in + halo glow
 *
 * Visibility:
 *   - mix-blend-mode: screen — the dark navy plate baked into the master
 *     image blends away on the dark theme so only the bright hex artwork
 *     remains visible. White/light text underneath stays sharp because
 *     screen of white = white.
 *   - pointer-events: none, low opacity — never affects readability.
 *   - prefers-reduced-motion: shows the mark fully assembled, no flight.
 * ────────────────────────────────────────────────────────────────────────── */

const MASTER_SRC = "/brand/mossaic-mark-512.png";
const VB_W = 1115;
const VB_H = 944;

type HexKind = "frame" | "inner" | "core" | "breakaway";

type Hex = {
  cx: number;
  cy: number;
  r: number;
  kind: HexKind;
  scatter: [number, number];
  start: number;
  end: number;
};

/** Pointy-top hex polygon points for a hex centered at (cx, cy) with radius r
 *  (distance from center to a vertex / point). */
function hexPts(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // start at top point
    pts.push(
      `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

/** Deterministic off-canvas scatter biased toward upper-right, in image
 *  coordinate units. Tiles fly in from beyond the top-right corner. */
function scatterFor(idx: number): [number, number] {
  const angleDeg = -78 + ((idx * 17) % 60); // -78° (high-right) to -18°
  const angle = (angleDeg * Math.PI) / 180;
  const radius = 900 + ((idx * 73) % 500); // 900 – 1400 units away
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  // Small jitter so they don't lie on a perfect arc
  const jx = Math.cos(idx * 2.3) * 60;
  const jy = Math.sin(idx * 1.7) * 60;
  return [x + jx, y + jy];
}

/* ── Hex layout — approximates the production master's hex cluster ──────── */
/* Five column-groups form the M:
 *   - Left leg:    cols 0 (x=120) + 1 (x=240, honeycomb-offset)
 *   - Inner left:  col 2 (x=380)
 *   - Center core: large glowing hex at (510, 455)
 *   - Inner right: col 3 (x=640)
 *   - Right leg:   cols 4 (x=780, honeycomb-offset) + 5 (x=900)
 * Plus 4 breakaway shards in the upper-right.
 */
const RAW_HEXES: Array<Omit<Hex, "scatter" | "start" | "end">> = [
  // Left thick leg — col A (x=120)
  { cx: 120, cy: 215, r: 78, kind: "frame" },
  { cx: 120, cy: 365, r: 78, kind: "frame" },
  { cx: 120, cy: 515, r: 78, kind: "frame" },
  { cx: 120, cy: 665, r: 78, kind: "frame" },
  // Left thick leg — col B (x=240, offset)
  { cx: 240, cy: 290, r: 78, kind: "frame" },
  { cx: 240, cy: 440, r: 78, kind: "frame" },
  { cx: 240, cy: 590, r: 78, kind: "frame" },
  { cx: 240, cy: 740, r: 78, kind: "frame" },

  // Inner left col (x=380)
  { cx: 380, cy: 215, r: 78, kind: "inner" },
  { cx: 380, cy: 365, r: 78, kind: "inner" },
  { cx: 380, cy: 590, r: 78, kind: "inner" },
  { cx: 380, cy: 740, r: 78, kind: "inner" },

  // Central glowing AI core (large)
  { cx: 510, cy: 470, r: 115, kind: "core" },

  // Inner right col (x=640)
  { cx: 640, cy: 215, r: 78, kind: "inner" },
  { cx: 640, cy: 365, r: 78, kind: "inner" },
  { cx: 640, cy: 590, r: 78, kind: "inner" },
  { cx: 640, cy: 740, r: 78, kind: "inner" },

  // Right thick leg — col A (x=780, offset)
  { cx: 780, cy: 290, r: 78, kind: "frame" },
  { cx: 780, cy: 440, r: 78, kind: "frame" },
  { cx: 780, cy: 590, r: 78, kind: "frame" },
  { cx: 780, cy: 740, r: 78, kind: "frame" },
  // Right thick leg — col B (x=900)
  { cx: 900, cy: 215, r: 78, kind: "frame" },
  { cx: 900, cy: 365, r: 78, kind: "frame" },
  { cx: 900, cy: 515, r: 78, kind: "frame" },
  { cx: 900, cy: 665, r: 78, kind: "frame" },

  // Breakaway shards (upper-right of the M)
  { cx: 1010, cy: 95, r: 70, kind: "breakaway" },
  { cx: 905, cy: 50, r: 60, kind: "breakaway" },
  { cx: 1065, cy: 215, r: 65, kind: "breakaway" },
  { cx: 980, cy: 290, r: 68, kind: "breakaway" },
];

export default function AssemblyBackdrop() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Build the timed hex list once.
  const hexes = useMemo<Hex[]>(() => {
    // Group by kind to schedule docking phases.
    const inners: number[] = [];
    const breakers: number[] = [];
    RAW_HEXES.forEach((h, i) => {
      if (h.kind === "inner") inners.push(i);
      else if (h.kind === "breakaway") breakers.push(i);
    });

    // Inner hexes dock outside-in (farther from center first).
    const center = { x: 510, y: 470 };
    inners.sort(
      (a, b) =>
        Math.hypot(RAW_HEXES[b].cx - center.x, RAW_HEXES[b].cy - center.y) -
        Math.hypot(RAW_HEXES[a].cx - center.x, RAW_HEXES[a].cy - center.y),
    );

    const ASSEMBLY_START = 0.08;
    const ASSEMBLY_END = 0.62;
    const TILE_DURATION = 0.22;
    const BREAK_START = 0.62;
    const BREAK_END = 0.82;
    const BREAK_DURATION = 0.18;

    const out: Hex[] = RAW_HEXES.map((h, i) => ({
      ...h,
      scatter: scatterFor(i),
      start: 0,
      end: 0,
    }));

    inners.forEach((idx, k) => {
      const span = ASSEMBLY_END - ASSEMBLY_START - TILE_DURATION;
      const start =
        inners.length > 1
          ? ASSEMBLY_START + (k / (inners.length - 1)) * span
          : ASSEMBLY_START;
      out[idx].start = start;
      out[idx].end = start + TILE_DURATION;
    });
    breakers.forEach((idx, k) => {
      const span = BREAK_END - BREAK_START - BREAK_DURATION;
      const start =
        breakers.length > 1
          ? BREAK_START + (k / (breakers.length - 1)) * span
          : BREAK_START;
      out[idx].start = start;
      out[idx].end = start + BREAK_DURATION;
    });

    return out;
  }, []);

  // Core fades in last, with a soft glow halo.
  const coreOpacity = useTransform(scrollYProgress, [0.78, 0.95], [0, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0.82, 1.0], [0, 0.85]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 5,
        // Screen blend so the dark navy plate baked into the master image
        // disappears on the dark theme — only the bright hex artwork shows.
        // White text underneath remains sharp (screen of white = white).
        mixBlendMode: "screen",
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "min(75vmin, 880px)",
          height: "auto",
          overflow: "visible",
          opacity: 0.85,
          aspectRatio: `${VB_W} / ${VB_H}`,
        }}
      >
        <defs>
          {hexes.map((h, i) => (
            <clipPath key={i} id={`abClip-${i}`}>
              <polygon points={hexPts(h.cx, h.cy, h.r)} />
            </clipPath>
          ))}
          <radialGradient
            id="abCoreGlow"
            cx="510"
            cy="470"
            r="220"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#22D3EE" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#22D3EE" stopOpacity="0.18" />
            <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Core glow halo — fades in last */}
        <motion.circle
          cx="510"
          cy="470"
          r="220"
          fill="url(#abCoreGlow)"
          style={{ opacity: reduced ? 0.85 : glowOpacity }}
        />

        {hexes.map((h, i) => (
          <HexPiece
            key={i}
            index={i}
            hex={h}
            progress={scrollYProgress}
            reduced={!!reduced}
            coreOpacity={coreOpacity}
          />
        ))}
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function HexPiece({
  index,
  hex,
  progress,
  reduced,
  coreOpacity,
}: {
  index: number;
  hex: Hex;
  progress: MotionValue<number>;
  reduced: boolean;
  coreOpacity: MotionValue<number>;
}) {
  const isAnimated = hex.kind === "inner" || hex.kind === "breakaway";

  // Travel from scattered offset → (0, 0), clamped within the window.
  const tx = useTransform(
    progress,
    [hex.start, hex.end],
    [hex.scatter[0], 0],
    { clamp: true },
  );
  const ty = useTransform(
    progress,
    [hex.start, hex.end],
    [hex.scatter[1], 0],
    { clamp: true },
  );
  // Fade in faster than the travel — visible by ~25% of the journey.
  const op = useTransform(
    progress,
    [hex.start, hex.start + (hex.end - hex.start) * 0.25, hex.end],
    [0, 0.7, 1],
    { clamp: true },
  );

  // The image is rendered full-size (VB_W x VB_H) and clipped to one hex.
  const imageEl = (
    <image
      href={MASTER_SRC}
      x={0}
      y={0}
      width={VB_W}
      height={VB_H}
      preserveAspectRatio="xMidYMid slice"
      clipPath={`url(#abClip-${index})`}
    />
  );

  if (reduced) {
    // Reduced-motion: show fully assembled.
    return <g>{imageEl}</g>;
  }

  if (hex.kind === "frame") {
    // Frame hexes are always present.
    return <g>{imageEl}</g>;
  }

  if (hex.kind === "core") {
    // Core fades in at the end (no flight).
    return (
      <motion.g style={{ opacity: coreOpacity }}>{imageEl}</motion.g>
    );
  }

  if (!isAnimated) return <g>{imageEl}</g>;

  return (
    <motion.g style={{ x: tx, y: ty, opacity: op }}>{imageEl}</motion.g>
  );
}

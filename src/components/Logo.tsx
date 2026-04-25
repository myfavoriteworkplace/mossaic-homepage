type Variant = "image" | "mark";

type Props = {
  /** Pixel size (square). */
  size?: number;
  /**
   * "image" — full-detail raster brand mark (recommended ≥ 48px slots: footer, hero).
   * "mark"  — vector mosaic-M (crisp at any size, recommended for nav/favicon/dense UI).
   */
  variant?: Variant;
  /** Renders the simplified version of the vector mark (no break-aways, no pins). */
  compact?: boolean;
  /** Adds soft pulse on the AI core + drift on break-away tiles (vector variant only). */
  animated?: boolean;
  /** Optional unique id suffix to avoid SVG def collisions when multiple logos render. */
  idSuffix?: string;
  className?: string;
};

const MARK_IMAGE = "/brand/mossaic-mark-512.png";
const MARK_IMAGE_AR = 1115 / 944;

// ──────────────────────────────────────────────────────────────────────────────
// Vector "mark" variant — mosaic-M letterform built from a 13×11 tile grid,
// with a hexagonal AI-chip core (IC pins on each edge) at the V-junction and
// 2–3 break-away tiles at the top-right. Crisp at any size.
// ──────────────────────────────────────────────────────────────────────────────

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
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
};

function VectorMark({
  size,
  compact,
  animated,
  idSuffix,
  className,
}: {
  size: number;
  compact: boolean;
  animated: boolean;
  idSuffix: string;
  className?: string;
}) {
  const u = idSuffix ? `-${idSuffix}` : "";

  type Tile = { cellKey: string; pts: string; shade: "primary" | "soft" };
  const tiles: Tile[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (PATTERN[r][c] !== "1") continue;
      const x = X0 + c * CELL;
      const y = Y0 + r * CELL;
      const x2 = x + CELL;
      const y2 = y + CELL;
      const cellKey = `${r}-${c}`;
      const altDir = (c + r) % 2 === 0;
      if (altDir) {
        tiles.push({ cellKey, pts: `${x},${y} ${x2},${y} ${x},${y2}`, shade: "primary" });
        tiles.push({ cellKey, pts: `${x2},${y} ${x2},${y2} ${x},${y2}`, shade: "soft" });
      } else {
        tiles.push({ cellKey, pts: `${x},${y} ${x2},${y} ${x2},${y2}`, shade: "soft" });
        tiles.push({ cellKey, pts: `${x},${y} ${x2},${y2} ${x},${y2}`, shade: "primary" });
      }
    }
  }

  const coreCx = 0;
  const coreCy = 6;
  const coreR = 5.2;
  const apothem = coreR * Math.cos(Math.PI / 6);
  const corePts = flatHexPts(coreCx, coreCy, coreR);

  type Pin = { x1: number; y1: number; x2: number; y2: number };
  const pins: Pin[] = [];
  const pinLen = 1.9;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (Math.PI / 3) * i;
    pins.push({
      x1: coreCx + apothem * Math.cos(a),
      y1: coreCy + apothem * Math.sin(a),
      x2: coreCx + (apothem + pinLen) * Math.cos(a),
      y2: coreCy + (apothem + pinLen) * Math.sin(a),
    });
  }

  return (
    <svg
      viewBox="-30 -30 60 60"
      width={size}
      height={size}
      role="img"
      aria-label="Mossaic"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`mosTile${u}`} x1="0" y1="-22" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id={`mosTileSoft${u}`} x1="0" y1="-22" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60A5FA" stopOpacity="0.95" />
          <stop offset="1" stopColor="#1D4ED8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`mosCore${u}`} x1="0" y1="0" x2="0" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A5F3FC" />
          <stop offset="0.5" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <radialGradient id={`mosGlow${u}`} cx={coreCx} cy={coreCy} r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0.6" />
          <stop offset="0.55" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <filter id={`mosBlur${u}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {!compact && <circle cx={coreCx} cy={coreCy} r="14" fill={`url(#mosGlow${u})`} />}

      <g strokeLinejoin="round">
        {tiles.map((t, i) => {
          const offset =
            !compact && BREAKAWAY_CELLS.has(t.cellKey)
              ? BREAKAWAY_OFFSETS[t.cellKey]
              : null;
          const fill = compact
            ? `url(#mosTile${u})`
            : `url(#mos${t.shade === "primary" ? "Tile" : "TileSoft"}${u})`;
          const transform = offset ? `translate(${offset[0]} ${offset[1]})` : undefined;
          return (
            <polygon
              key={i}
              points={t.pts}
              fill={fill}
              stroke="#1E40AF"
              strokeWidth="0.35"
              opacity={compact ? 0.98 : t.shade === "primary" ? 0.96 : 0.88}
              transform={transform}
            >
              {animated && offset && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${offset[0]},${offset[1]}; ${(offset[0] * 0.55).toFixed(2)},${(offset[1] * 0.55).toFixed(2)}; ${offset[0]},${offset[1]}`}
                  dur={`${6 + (i % 3)}s`}
                  repeatCount="indefinite"
                />
              )}
            </polygon>
          );
        })}
      </g>

      <g>
        <polygon
          points={corePts}
          fill={`url(#mosCore${u})`}
          filter={`url(#mosBlur${u})`}
          opacity="0.6"
        />
        {!compact &&
          pins.map((p, i) => (
            <line
              key={i}
              x1={p.x1.toFixed(2)}
              y1={p.y1.toFixed(2)}
              x2={p.x2.toFixed(2)}
              y2={p.y2.toFixed(2)}
              stroke="#A5F3FC"
              strokeWidth="0.95"
              strokeLinecap="round"
              opacity="0.85"
            />
          ))}
        <polygon
          points={corePts}
          fill={`url(#mosCore${u})`}
          stroke="#A5F3FC"
          strokeWidth="0.55"
          strokeLinejoin="round"
        >
          {animated && (
            <animate
              attributeName="opacity"
              values="1; 0.78; 1"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </polygon>
        {!compact && (
          <polygon
            points={flatHexPts(coreCx, coreCy, coreR * 0.55)}
            fill="none"
            stroke="#0E7490"
            strokeWidth="0.45"
            opacity="0.75"
          />
        )}
      </g>
    </svg>
  );
}

function ImageMark({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const height = size;
  const width = Math.round(size * MARK_IMAGE_AR);
  return (
    <img
      src={MARK_IMAGE}
      alt="Mossaic"
      width={width}
      height={height}
      decoding="async"
      loading="eager"
      draggable={false}
      className={className}
      style={{
        display: "block",
        width,
        height,
        userSelect: "none",
      }}
    />
  );
}

export default function Logo({
  size = 24,
  variant = "image",
  compact = false,
  animated = false,
  idSuffix = "",
  className,
}: Props) {
  if (variant === "mark") {
    return (
      <VectorMark
        size={size}
        compact={compact}
        animated={animated}
        idSuffix={idSuffix}
        className={className}
      />
    );
  }
  return <ImageMark size={size} className={className} />;
}

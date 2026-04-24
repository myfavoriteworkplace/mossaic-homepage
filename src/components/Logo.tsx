type Props = {
  /** Pixel size (square). */
  size?: number;
  /** Renders the simplified mark suitable for tiny sizes (favicon, nav). */
  compact?: boolean;
  /** Adds a soft pulse on the AI core. */
  animated?: boolean;
  /** Optional unique id suffix to avoid SVG def collisions when multiple logos render. */
  idSuffix?: string;
  className?: string;
};

/**
 * Mossaic "Hex Core" mark — 1 luminous cyan center hex + 6 deep-blue ring hexes.
 * Two ring hexes break away from the cluster to suggest modular assembly.
 */
export default function Logo({
  size = 24,
  compact = false,
  animated = false,
  idSuffix = "",
  className,
}: Props) {
  const u = idSuffix ? `-${idSuffix}` : "";

  // Hex geometry (pointy-top, side s = 9)
  // apothem a = s*√3/2 ≈ 7.794, neighbor distance = 2a ≈ 15.588
  const hex = (cx: number, cy: number) =>
    `${cx},${cy - 9} ${cx + 7.794},${cy - 4.5} ${cx + 7.794},${cy + 4.5} ${cx},${cy + 9} ${cx - 7.794},${cy + 4.5} ${cx - 7.794},${cy - 4.5}`;

  // 6 ring hex centers + center
  const center = hex(0, 0);
  const right = hex(15.588, 0);
  const topRight = hex(7.794, -13.5);
  const topLeft = hex(-7.794, -13.5);
  const left = hex(-15.588, 0);
  const bottomLeft = hex(-7.794, 13.5);
  const bottomRight = hex(7.794, 13.5);

  // Two "break-away" hexes: nudged outward
  const rightOffset = hex(15.588 + 2.4, 0);
  const topRightOffset = hex(7.794 + 1.6, -13.5 - 1.4);

  return (
    <svg
      viewBox="-28 -28 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="Mossaic"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`mosCore${u}`} x1="0" y1="-12" x2="0" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A5F3FC" />
          <stop offset="0.5" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={`mosRing${u}`} x1="0" y1="-12" x2="0" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id={`mosRingSoft${u}`} x1="0" y1="-12" x2="0" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60A5FA" stopOpacity="0.85" />
          <stop offset="1" stopColor="#1D4ED8" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`mosGlow${u}`} cx="0" cy="0" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#22D3EE" stopOpacity="0.12" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <filter id={`mosBlur${u}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* Halo behind the core */}
      {!compact && <circle cx="0" cy="0" r="22" fill={`url(#mosGlow${u})`} />}

      {/* Outer ring hexes */}
      <g
        fill={`url(#mosRing${u})`}
        stroke={`url(#mosRingSoft${u})`}
        strokeWidth="0.6"
        strokeLinejoin="round"
      >
        <polygon points={left} opacity="0.95" />
        <polygon points={topLeft} opacity="0.95" />
        <polygon points={bottomLeft} opacity="0.95" />
        <polygon points={bottomRight} opacity="0.95" />

        {/* Two break-away hexes (slightly offset). On compact, snap them back. */}
        <polygon points={compact ? right : rightOffset} opacity="0.92">
          {animated && !compact && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="2.4,0; 0,0; 2.4,0"
              dur="6s"
              repeatCount="indefinite"
            />
          )}
        </polygon>
        <polygon points={compact ? topRight : topRightOffset} opacity="0.92">
          {animated && !compact && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="1.6,-1.4; 0,0; 1.6,-1.4"
              dur="7s"
              repeatCount="indefinite"
            />
          )}
        </polygon>
      </g>

      {/* AI core — glowing center hex */}
      <g>
        <polygon
          points={center}
          fill={`url(#mosCore${u})`}
          filter={`url(#mosBlur${u})`}
          opacity="0.55"
        />
        <polygon
          points={center}
          fill={`url(#mosCore${u})`}
          stroke="#A5F3FC"
          strokeWidth="0.4"
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
      </g>
    </svg>
  );
}

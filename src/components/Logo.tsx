type Props = {
  /** Pixel size (square). */
  size?: number;
  /** Reserved for parity with the previous mark — currently a no-op for the raster brand image. */
  compact?: boolean;
  /** Reserved for parity with the previous mark — currently a no-op for the raster brand image. */
  animated?: boolean;
  /** Reserved for parity with the previous mark — kept so call sites don't change. */
  idSuffix?: string;
  className?: string;
};

const MARK_SRC = "/brand/mossaic-mark-512.png";

/**
 * Mossaic mark — capital "M" assembled from glowing mosaic tiles with a
 * luminous AI-network core at the center and three crystal shards breaking
 * away from the top-right corner. Rendered from the brand image asset
 * served from `/public/brand/`.
 */
export default function Logo({
  size = 24,
  compact: _compact,
  animated: _animated,
  idSuffix: _idSuffix,
  className,
}: Props) {
  void _compact;
  void _animated;
  void _idSuffix;
  return (
    <img
      src={MARK_SRC}
      alt="Mossaic"
      width={size}
      height={size}
      decoding="async"
      loading="eager"
      draggable={false}
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        userSelect: "none",
      }}
    />
  );
}

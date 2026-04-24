type Props = {
  /** "nav" = compact tight tracking, "footer" = same with optional ticks, "hero" = larger. */
  variant?: "nav" | "footer" | "hero";
  /** Color of the "moss" / "c" text. Defaults to white. */
  textColor?: string;
  className?: string;
};

/**
 * Mossaic wordmark: moss[AI]c — with the AI letters rendered in a glowing
 * cyan-to-blue gradient that visually highlights the "AI" inside the brand.
 */
export default function Wordmark({
  variant = "nav",
  textColor,
  className,
}: Props) {
  const sizeClass =
    variant === "hero"
      ? "text-4xl md:text-5xl"
      : variant === "footer"
      ? "text-lg"
      : "text-xl";

  return (
    <span
      className={`mos-wordmark display font-bold inline-flex items-baseline ${sizeClass} ${
        className ?? ""
      }`}
      style={{
        letterSpacing: "-0.04em",
        color: textColor,
        lineHeight: 1,
      }}
      aria-label="Mossaic"
    >
      <span>moss</span>
      <span className="mos-ai" aria-hidden="true">
        AI
      </span>
      <span>c</span>
      <style>{`
        .mos-wordmark .mos-ai {
          background-image: linear-gradient(180deg, #A5F3FC 0%, #22D3EE 45%, #3B82F6 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.55))
                  drop-shadow(0 0 14px rgba(59, 130, 246, 0.25));
          padding: 0 0.02em;
        }
      `}</style>
    </span>
  );
}

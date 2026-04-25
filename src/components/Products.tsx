import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Store, Brain } from "lucide-react";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import BookMySlotText from "./ui/BookMySlotText";
import { PRODUCTS, type Product } from "../data/site";

type Screen = {
  src: string;
  alt: string;
  /** Custom focal point for object-fit:cover. Defaults to "center top". */
  objectPosition?: string;
};

const BOOKMYSLOT_SCREENS: Screen[] = [
  {
    src: "/products/bookmyslot-screens/01-home.png",
    alt: "bookMySlot landing page",
    objectPosition: "center 22%",
  },
  {
    src: "/products/bookmyslot-screens/02-book.png",
    alt: "Patient picking an appointment slot",
    objectPosition: "center top",
  },
  {
    src: "/products/bookmyslot-screens/03-portal-light.png",
    alt: "Doctor portal — daily schedule",
    objectPosition: "center top",
  },
  {
    src: "/products/bookmyslot-screens/04-portal-dark.png",
    alt: "Doctor portal — appointments management",
    objectPosition: "center top",
  },
];

const ICONS: Record<string, React.ReactNode> = {
  bookmyslot: (
    <img
      src="/products/bookmyslot-icon.png"
      alt=""
      width={48}
      height={48}
      decoding="async"
      loading="lazy"
      draggable={false}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  ),
  "retail-crm": <Store size={24} className="text-white" strokeWidth={1.6} />,
  "ai-imaging": <Brain size={24} className="text-white" strokeWidth={1.6} />,
};

const ACCENT_BG: Record<Product["accent"], string> = {
  moss: "bg-moss",
  amber: "bg-[var(--amber)]",
  blue: "bg-[var(--blue)]",
  purple: "bg-[var(--purple)]",
};

const ICON_FULL_TILE = new Set(["bookmyslot"]);

export default function Products() {
  return (
    <section
      id="products"
      className="bg-page"
      style={{ padding: "100px var(--pad)" }}
    >
      <div className="container-x">
        <Reveal className="text-center mb-16">
          <div className="tag tag-green mb-4">Our products</div>
          <h2 className="section-title">
            One company.
            <br />
            <em className="underline-mark">Products that actually work.</em>
          </h2>
          <p className="section-sub mt-3.5">
            We build focused, deep software for industries that have been
            underserved by generic SaaS. Each product ships when it's
            genuinely ready.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:[grid-template-columns:1.4fr_1fr_1fr]">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <TiltCard
                className="group h-full rounded-2xl"
                max={5}
                scale={1.015}
                style={{
                  background: "rgb(var(--bg-rgb))",
                }}
              >
                <ProductCard
                  p={p}
                  icon={ICONS[p.id]}
                  accentClass={ACCENT_BG[p.accent]}
                  iconFullTile={ICON_FULL_TILE.has(p.id)}
                  screens={p.id === "bookmyslot" ? BOOKMYSLOT_SCREENS : undefined}
                />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  p,
  icon,
  accentClass,
  iconFullTile = false,
  screens,
}: {
  p: Product;
  icon: React.ReactNode;
  accentClass: string;
  iconFullTile?: boolean;
  screens?: Screen[];
}) {
  const isLive = p.status === "live";
  const [hovered, setHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const carouselActive = !!screens && (hovered || isTouch);

  return (
    <div
      className={`relative h-full rounded-2xl border border-border1 group-hover:border-moss/40 transition-all p-7 overflow-hidden ${
        isLive ? "" : "opacity-90 group-hover:opacity-100"
      }`}
      style={{
        boxShadow: "0 0 0 transparent",
        transition: "box-shadow .35s, border-color .35s",
      }}
      onMouseEnter={() => screens && setHovered(true)}
      onMouseLeave={() => screens && setHovered(false)}
    >
      <motion.span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-0.5 origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        style={{
          background: "linear-gradient(90deg, rgb(var(--accent-rgb)), rgb(var(--accent-mid-rgb)))",
          transform: "scaleX(0)",
        }}
      />

      <div className="flex items-start justify-between mb-5">
        <div
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
            iconFullTile ? "" : accentClass
          }`}
        >
          {!iconFullTile && (
            <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          )}
          <span className={iconFullTile ? "block w-full h-full" : "relative z-10"}>
            {icon}
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-[10px] ${
            isLive
              ? "bg-moss-light text-moss-dark"
              : "bg-surface text-ink-4 border border-border1"
          }`}
        >
          {p.statusLabel}
        </span>
      </div>

      <h3 className="text-xl font-bold text-ink mb-1.5 display tracking-tight">
        {p.id === "bookmyslot" ? <BookMySlotText /> : p.name}
      </h3>
      <p className="text-xs text-moss font-semibold mb-2.5 tracking-wide">
        {p.category}
      </p>

      {/* swap-zone: description + metrics + tags fade out when carousel is active */}
      <div className="relative">
        <div
          className="transition-opacity duration-300"
          style={{
            opacity: carouselActive ? 0 : 1,
            pointerEvents: carouselActive ? "none" : "auto",
          }}
          aria-hidden={carouselActive}
        >
          <p className="text-sm text-ink-2 leading-[1.65] mb-5">{p.description}</p>

          {p.metrics && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {p.metrics.map((m, i) => (
                <div
                  key={i}
                  className="bg-surface border border-border2 rounded-lg px-3 py-2.5"
                >
                  <div
                    className={`text-[18px] font-bold leading-none display ${
                      m.green ? "text-moss" : "text-ink"
                    }`}
                  >
                    {m.value}
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-5">
            {p.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2.5 py-1 rounded-full bg-surface text-ink-3 border border-border2"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {screens && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{
              opacity: carouselActive ? 1 : 0,
              pointerEvents: "none",
            }}
            aria-hidden={!carouselActive}
          >
            <ScreenCarousel screens={screens} active={carouselActive} />
          </div>
        )}
      </div>

      <a
        href={p.cta.href}
        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold hover:gap-2.5 transition-all no-underline ${
          isLive ? "text-moss" : "text-ink-3"
        }`}
        target={p.cta.href.startsWith("http") ? "_blank" : undefined}
        rel={p.cta.href.startsWith("http") ? "noreferrer noopener" : undefined}
      >
        {p.id === "bookmyslot" && p.cta.label === "Visit bookMySlot" ? (
          <span className="inline-flex items-center gap-1">
            Visit <BookMySlotText />
          </span>
        ) : (
          p.cta.label
        )}
        <ArrowRight size={13} />
      </a>
    </div>
  );
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  phase: number;
};

const TRANSITION_MS = 900;
const HOLD_MS = 1700; // total cycle = ~2600ms (close to original 2200 + transition headroom)

function ScreenCarousel({ screens, active }: { screens: Screen[]; active: boolean }) {
  const [i, setI] = useState(0);
  const [imgOpacity, setImgOpacity] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotionRef = useRef(false);

  // detect reduced motion once
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (!active) {
      setI(0);
      setImgOpacity(1);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let cycleTimeout = 0;

    const runDissolve = () => {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) {
        scheduleNext();
        return;
      }

      // reduced motion → quick crossfade fallback, no particles
      if (reducedMotionRef.current) {
        setImgOpacity(0);
        window.setTimeout(() => {
          if (cancelled) return;
          setI((v) => (v + 1) % screens.length);
          setImgOpacity(1);
          scheduleNext();
        }, 250);
        return;
      }

      // size canvas to its CSS box
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        scheduleNext();
        return;
      }
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        scheduleNext();
        return;
      }
      ctx.scale(dpr, dpr);

      // seed particles across the viewport
      const PARTICLE_COUNT = Math.round((w * h) / 1400); // density-based, ~80–110 typical
      const particles: Particle[] = [];
      for (let p = 0; p < PARTICLE_COUNT; p++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.3 - Math.random() * 1.1,
          size: 0.8 + Math.random() * 1.8,
          hue: 182 + Math.random() * 22, // cyan band (matches site accent)
          phase: Math.random() * Math.PI * 2,
        });
      }

      const start = performance.now();
      let swapped = false;

      const frame = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        const t = Math.min(1, elapsed / TRANSITION_MS);

        // image opacity envelope: 1 → 0 → 1 (cosine squared)
        const imgA = Math.cos(Math.PI * t) ** 2;
        setImgOpacity(imgA);

        // swap image at midpoint
        if (!swapped && t >= 0.5) {
          swapped = true;
          setI((v) => (v + 1) % screens.length);
        }

        // particle envelope: 0 → 1 → 0 (sine)
        const partA = Math.sin(Math.PI * t);

        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        for (const pt of particles) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          // wrap horizontally so particles don't drift away in long tails
          if (pt.x < -10) pt.x = w + 10;
          if (pt.x > w + 10) pt.x = -10;

          const flicker = 0.55 + 0.45 * Math.sin(pt.phase + (elapsed / 80));
          const a = partA * flicker;
          if (a <= 0.01) continue;

          // soft outer glow
          const r = pt.size * 4.5;
          const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
          glow.addColorStop(0, `hsla(${pt.hue}, 100%, 70%, ${a * 0.55})`);
          glow.addColorStop(1, `hsla(${pt.hue}, 100%, 70%, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
          ctx.fill();

          // bright core
          ctx.fillStyle = `hsla(${pt.hue}, 100%, 92%, ${a})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (t < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, w, h);
          setImgOpacity(1);
          scheduleNext();
        }
      };

      rafId = requestAnimationFrame(frame);
    };

    const scheduleNext = () => {
      if (cancelled) return;
      cycleTimeout = window.setTimeout(runDissolve, HOLD_MS);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(cycleTimeout);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, screens.length]);

  const current = screens[i];

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        background: "rgb(var(--bg-rgb))",
        border: "1px solid rgb(var(--border1-rgb, 226 232 240))",
        boxShadow: "0 12px 32px -16px rgba(15, 23, 42, 0.35)",
      }}
    >
      {/* faux browser chrome */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5"
        style={{
          background: "var(--surface, rgba(15,23,42,0.04))",
          borderBottom: "1px solid rgb(var(--border2-rgb, 226 232 240))",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF5F57" }} />
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FEBC2E" }} />
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#28C840" }} />
        <div className="ml-2 flex-1 h-3 rounded-sm" style={{ background: "rgba(15,23,42,0.05)" }} />
      </div>

      {/* viewport */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 10", background: "#0a1628" }}>
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover",
            objectPosition: current.objectPosition ?? "center top",
            display: "block",
            opacity: imgOpacity,
            transition: "opacity 60ms linear",
            willChange: "opacity",
          }}
        />

        {/* particle dissolve overlay */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: "screen" }}
        />

        {/* progress dots */}
        <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1">
          {screens.map((_, idx) => (
            <span
              key={idx}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: idx === i ? 14 : 4,
                background:
                  idx === i ? "rgb(var(--accent-rgb))" : "rgba(15,23,42,0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

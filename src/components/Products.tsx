import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function ScreenCarousel({ screens, active }: { screens: Screen[]; active: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active) {
      setI(0);
      return;
    }
    const id = window.setInterval(
      () => setI((v) => (v + 1) % screens.length),
      2200,
    );
    return () => window.clearInterval(id);
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
      <div className="relative w-full" style={{ aspectRatio: "16 / 10", background: "#fff" }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={current.src}
            src={current.src}
            alt={current.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: current.objectPosition ?? "center top",
              display: "block",
            }}
          />
        </AnimatePresence>

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

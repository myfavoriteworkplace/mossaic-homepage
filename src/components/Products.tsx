import { motion } from "framer-motion";
import { ArrowRight, Store, Brain } from "lucide-react";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import { PRODUCTS, type Product } from "../data/site";

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
}: {
  p: Product;
  icon: React.ReactNode;
  accentClass: string;
  iconFullTile?: boolean;
}) {
  const isLive = p.status === "live";

  return (
    <div
      className={`relative h-full rounded-2xl border border-border1 group-hover:border-moss/40 transition-all p-7 overflow-hidden ${
        isLive ? "" : "opacity-90 group-hover:opacity-100"
      }`}
      style={{
        boxShadow: "0 0 0 transparent",
        transition: "box-shadow .35s, border-color .35s",
      }}
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
        {p.name}
      </h3>
      <p className="text-xs text-moss font-semibold mb-2.5 tracking-wide">
        {p.category}
      </p>
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

      <a
        href={p.cta.href}
        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold hover:gap-2.5 transition-all no-underline ${
          isLive ? "text-moss" : "text-ink-3"
        }`}
        target={p.cta.href.startsWith("http") ? "_blank" : undefined}
        rel={p.cta.href.startsWith("http") ? "noreferrer noopener" : undefined}
      >
        {p.cta.label}
        <ArrowRight size={13} />
      </a>
    </div>
  );
}

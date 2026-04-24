import { motion } from "framer-motion";
import { ArrowRight, Calendar, Activity, Brain } from "lucide-react";
import HeroBackground from "./HeroBackground";
import MagneticButton from "./ui/MagneticButton";
import AnimatedCounter from "./ui/AnimatedCounter";

type Word = string | { text: string; em?: boolean; period?: boolean };

const HEADLINE_LINES: Word[][] = [
  ["We", "build", "modern"],
  ["software", "for", "the"],
  ["industries", "that", { text: "still", em: true }],
  [
    { text: "run", em: true },
    { text: "on", em: true },
    { text: "workarounds.", period: true },
  ],
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden min-h-screen flex flex-col justify-center"
      style={{
        background: "var(--hero-bg)",
        padding: "120px var(--pad) 100px",
      }}
    >
      {/* grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(86,201,158,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(86,201,158,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* glows */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 700,
          height: 700,
          top: -200,
          right: -100,
          background:
            "radial-gradient(circle, rgba(26,158,116,0.12) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 500,
          height: 500,
          bottom: -100,
          left: -100,
          background:
            "radial-gradient(circle, rgba(26,158,116,0.08) 0%, transparent 65%)",
        }}
      />

      {/* particle network */}
      <HeroBackground />

      <div className="relative z-[2] max-w-container mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 bg-[rgba(26,158,116,0.12)] border border-[rgba(86,201,158,0.2)] rounded-full px-3.5 py-1.5 text-xs text-moss-mid">
              <span
                className="w-[7px] h-[7px] rounded-full bg-moss-mid animate-pulse-glow"
                aria-hidden
              />
              bookMySlot is live · serving Kerala clinics
            </span>
          </motion.div>

          <h1
            className="font-serif text-white mb-6 tracking-tight"
            style={{
              fontSize: "clamp(40px, 5vw, 66px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            {HEADLINE_LINES.map((line, li) => (
              <span key={li} className="block">
                {line.map((w, wi) => {
                  const word = typeof w === "string" ? w : w.text;
                  const em = typeof w !== "string" && w.em;
                  const period = typeof w !== "string" && w.period;
                  return (
                    <motion.span
                      key={`${li}-${wi}`}
                      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.6,
                        delay: 0.08 * (li * 3 + wi),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`inline-block ${
                        em ? "text-moss-mid italic" : period ? "text-moss" : ""
                      }`}
                    >
                      {word}
                      {wi < line.length - 1 ? "\u00A0" : ""}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-[17px] leading-[1.7] mb-9 max-w-[460px] font-light"
            style={{ color: "var(--hero-sub)" }}
          >
            Mossaic builds focused, modular SaaS — starting with healthcare and
            extending into retail and explainable AI. Built in India, for India.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="flex flex-wrap items-center gap-3 mb-12"
          >
            <MagneticButton
              as="a"
              href="https://bookmyslot.dental.mossaic.in"
              className="inline-flex items-center gap-2 bg-moss hover:bg-moss-dark text-white rounded-[10px] px-6 py-3.5 text-sm font-medium no-underline transition-colors"
            >
              Try bookMySlot
              <ArrowRight size={14} />
            </MagneticButton>
            <a
              href="#products"
              className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/30 text-white/75 hover:text-white rounded-[10px] px-6 py-3.5 text-sm transition-all no-underline"
            >
              See our products
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex items-center gap-7"
          >
            <div>
              <div className="font-serif text-[28px] text-white leading-none">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--hero-sub)" }}>
                Clinics live
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="font-serif text-[28px] text-white leading-none">
                <AnimatedCounter value={850} suffix="+" />
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--hero-sub)" }}>
                Slots booked
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="font-serif text-[28px] text-white leading-none">
                <span className="text-moss-mid">1</span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--hero-sub)" }}>
                Live · 2 building
              </div>
            </div>
          </motion.div>
        </div>

        {/* right — product card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex justify-center items-center"
          style={{ perspective: 1200 }}
        >
          <div className="relative w-full max-w-[480px]">
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: "var(--hero-card)",
                border: "1px solid var(--hero-border)",
              }}
            >
              <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(86,201,158,0.5), transparent)",
                }}
              />

              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 rounded-[10px] bg-moss flex items-center justify-center overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  <Calendar size={20} className="text-white relative z-10" strokeWidth={1.6} />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">bookMySlot</div>
                  <div className="text-[11px] mt-px" style={{ color: "var(--hero-sub)" }}>
                    Today · 4 appointments
                  </div>
                </div>
                <div
                  className="ml-auto flex items-center gap-1.5 text-[10px] font-medium tracking-wider"
                  style={{ color: "var(--moss-mid)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-moss-mid animate-pulse-glow" />
                  LIVE
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3.5 mb-3.5">
                {[
                  { av: "RK", name: "Rohit K.", time: "Mon · 11:30 AM · Cleaning", badge: "C", label: "Confirmed" },
                  { av: "AM", name: "Anjali M.", time: "Tue · 4:00 PM · Filling", badge: "P", label: "Pending" },
                  { av: "SR", name: "Suresh R.", time: "Wed · 3:00 PM · Root Canal", badge: "N", label: "New" },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
                    className={`flex items-center gap-2.5 py-1.5 ${
                      i < 2 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-moss/25 flex items-center justify-center text-[9px] font-semibold text-moss-mid flex-shrink-0">
                      {row.av}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-white/80 font-medium">{row.name}</div>
                      <div className="text-[9px] mt-px" style={{ color: "var(--hero-sub)" }}>
                        {row.time}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${
                        row.badge === "C"
                          ? "bg-moss/20 text-moss-mid"
                          : row.badge === "P"
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {row.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 128, label: "Patients" },
                  { v: 24, label: "This week" },
                  { v: 38, label: "Revenue", green: true, prefix: "₹", suffix: "k" },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5"
                  >
                    <div
                      className={`text-[18px] font-semibold leading-none ${
                        m.green ? "text-moss-mid" : "text-white"
                      }`}
                    >
                      <AnimatedCounter
                        value={m.v}
                        prefix={m.prefix}
                        suffix={m.suffix}
                      />
                    </div>
                    <div
                      className="text-[9px] mt-1 uppercase tracking-wider"
                      style={{ color: "var(--hero-sub)" }}
                    >
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* floating cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.7 }}
              className="absolute -right-12 top-14 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 backdrop-blur-md animate-float1"
              style={{
                background: "rgba(13,35,24,0.85)",
                border: "1px solid var(--hero-border)",
              }}
            >
              <div className="w-7 h-7 rounded-md bg-amber-500/15 flex items-center justify-center">
                <Activity size={13} className="text-amber-500" />
              </div>
              <div>
                <div className="text-[11px] text-white/70 font-medium">Retail CRM</div>
                <div className="text-[9px] mt-px" style={{ color: "var(--hero-sub)" }}>
                  Customer management
                </div>
              </div>
              <span
                className="text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded-md uppercase ml-auto"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--hero-sub)" }}
              >
                Soon
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.7 }}
              className="absolute -left-14 bottom-20 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 backdrop-blur-md animate-float2"
              style={{
                background: "rgba(13,35,24,0.85)",
                border: "1px solid var(--hero-border)",
              }}
            >
              <div className="w-7 h-7 rounded-md bg-purple-500/15 flex items-center justify-center">
                <Brain size={13} className="text-purple-400" />
              </div>
              <div>
                <div className="text-[11px] text-white/70 font-medium">AI Imaging</div>
                <div className="text-[9px] mt-px" style={{ color: "var(--hero-sub)" }}>
                  Diagnostic assist
                </div>
              </div>
              <span
                className="text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded-md uppercase ml-auto"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--hero-sub)" }}
              >
                2027
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

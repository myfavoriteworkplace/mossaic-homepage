import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, CircleDot, Clock, Plus } from "lucide-react";
import Reveal from "./ui/Reveal";
import { ROADMAP } from "../data/site";

const ICONS = {
  done: <Check size={20} strokeWidth={2.2} className="text-white" />,
  next: <CircleDot size={20} strokeWidth={1.8} className="text-moss-mid" />,
  future: <Clock size={20} strokeWidth={1.6} className="text-white/40" />,
};

const FUTURE_ICON_BEYOND = <Plus size={20} strokeWidth={1.8} className="text-white/40" />;

export default function Roadmap() {
  const lineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(lineRef, { once: true, margin: "-80px" });

  return (
    <section
      id="roadmap"
      className="relative overflow-hidden"
      style={{ padding: "var(--section-pad-y) var(--pad)", background: "var(--moss-deeper)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(86,201,158,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(86,201,158,0.05) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 600,
          height: 600,
          top: -200,
          right: -100,
          background:
            "radial-gradient(circle, rgba(26,158,116,0.1), transparent 65%)",
        }}
      />

      <div className="relative z-[1] max-w-container mx-auto">
        <Reveal className="text-center mb-16">
          <div className="tag tag-dark mb-4">What we're building</div>
          <h2 className="section-title text-white">
            The Mossaic <em className="italic" style={{ color: "var(--moss-mid)" }}>roadmap.</em>
          </h2>
          <p className="section-sub" style={{ color: "var(--hero-sub)" }}>
            One product at a time. Each one shipped properly before the next begins.
          </p>
        </Reveal>

        <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-y-8" ref={lineRef}>
          {/* connecting line */}
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="origin-left h-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(86,201,158,0.3), var(--moss), rgba(86,201,158,0.3), transparent)",
              }}
            />
          </div>

          {ROADMAP.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className={`text-center px-4 relative ${
                item.status === "future" ? "opacity-90" : ""
              }`}
            >
              <div className="flex justify-center mb-5">
                <div
                  className={`relative z-[1] w-14 h-14 rounded-full flex items-center justify-center ${
                    item.status === "done"
                      ? "bg-moss"
                      : item.status === "next"
                      ? "bg-white/5 border border-[rgba(86,201,158,0.2)]"
                      : "bg-white/[0.03] border border-dashed border-white/10"
                  }`}
                  style={
                    item.status === "done"
                      ? {
                          boxShadow:
                            "0 0 0 4px rgba(26,158,116,0.15), 0 0 20px rgba(26,158,116,0.2)",
                        }
                      : undefined
                  }
                >
                  {item.year === "Beyond" ? FUTURE_ICON_BEYOND : ICONS[item.status]}
                </div>
              </div>
              <div
                className="font-mono text-[11px] font-medium mb-1.5"
                style={{
                  color:
                    item.status === "future" && item.year !== "2027"
                      ? "rgba(255,255,255,0.25)"
                      : "var(--moss-mid)",
                }}
              >
                {item.year}
              </div>
              <div
                className={`text-[15px] font-semibold mb-1.5 ${
                  item.status === "future" ? "text-white/40" : "text-white"
                }`}
              >
                {item.name}
              </div>
              <div
                className={`text-xs leading-snug ${
                  item.status === "next"
                    ? "text-white/55"
                    : item.status === "future"
                    ? "text-white/40"
                    : "text-white/55"
                }`}
              >
                {item.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

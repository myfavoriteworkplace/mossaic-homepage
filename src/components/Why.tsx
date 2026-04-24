import { ShieldCheck, BadgeCheck } from "lucide-react";
import Reveal from "./ui/Reveal";
import { PRINCIPLES, COMPLIANCE_BADGES, TECH_STACK } from "../data/site";

export default function Why() {
  return (
    <section
      id="why"
      className="bg-surface"
      style={{ padding: "100px var(--pad)" }}
    >
      <div className="max-w-container mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div>
          <Reveal>
            <div className="tag tag-green mb-4">Why Mossaic</div>
            <h2 className="section-title text-left">
              Built different
              <br />
              by <em className="underline-mark">design.</em>
            </h2>
            <p className="section-sub text-left mt-3.5 mx-0">
              Four principles that shape everything we build — not marketing
              copy, but the actual way we make decisions.
            </p>
          </Reveal>

          <div className="mt-10 flex flex-col">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.num} delay={i * 0.07}>
                <div
                  className="group flex gap-5 items-start py-5 border-b border-border1 last:border-b-0 first:pt-0"
                  style={{ transition: "all .2s" }}
                >
                  <div className="font-mono text-[11px] font-medium text-ink-4 min-w-6 mt-1 group-hover:text-moss transition-colors">
                    {p.num}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-ink mb-1">
                      {p.title}
                    </div>
                    <div className="text-sm text-ink-3 leading-relaxed">
                      {p.desc}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <Reveal>
            <div className="bg-page border border-border1 rounded-2xl p-7 mb-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-ink-4 mb-4">
                Compliance &amp; data standards
              </h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {COMPLIANCE_BADGES.map((b, i) => (
                  <div
                    key={b}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border1 bg-surface text-xs font-medium text-ink-2"
                  >
                    {i < 2 ? (
                      <ShieldCheck size={14} className="text-moss" strokeWidth={1.7} />
                    ) : (
                      <BadgeCheck size={14} className="text-moss" strokeWidth={1.7} />
                    )}
                    {b}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-ink-3 leading-relaxed">
                Customer data never leaves Indian servers. Full consent
                management, audit-trailed workflows, and encrypted storage
                on every plan.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-page border border-border1 rounded-2xl p-7">
              <h4 className="text-xs font-semibold tracking-wider uppercase text-ink-4 mb-4">
                Technology stack
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {TECH_STACK.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-surface text-ink-2 border border-border2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

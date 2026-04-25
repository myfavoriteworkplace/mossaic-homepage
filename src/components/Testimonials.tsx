import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import BookMySlotText from "./ui/BookMySlotText";
import { TESTIMONIALS } from "../data/site";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="bg-surface"
      style={{ padding: "100px var(--pad)" }}
    >
      <div className="container-x">
        <Reveal className="text-center mb-12">
          <div className="tag tag-green mb-4">From our products in market</div>
          <h2 className="section-title">
            What customers are <em className="underline-mark">saying.</em>
          </h2>
          <p className="section-sub mt-3.5">
            Quotes from clinics using <BookMySlotText /> today.
            Retail CRM and AI Imaging customer stories will join them as
            those products go live.
          </p>
        </Reveal>

        <div className="max-w-container mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <TiltCard className="group h-full rounded-2xl" max={4} scale={1.012}>
                <div className="bg-page border border-border1 rounded-2xl p-7 transition-all hover:border-moss/40 h-full">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <span key={k} className="text-[15px] text-amber-400">
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-moss-light text-moss-dark">
                      {t.product}
                    </span>
                  </div>
                  <p className="text-[15px] text-ink leading-relaxed mb-5 font-medium">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-moss-light flex items-center justify-center text-xs font-semibold text-moss-dark flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-ink">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-ink-3 mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import { TESTIMONIALS } from "../data/site";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      style={{ padding: "100px var(--pad)", background: "var(--surface)" }}
    >
      <div className="container-x">
        <Reveal className="text-center mb-12">
          <div className="tag tag-green mb-4">Early adopters</div>
          <h2 className="section-title">
            What clinics are <em>saying.</em>
          </h2>
        </Reveal>

        <div className="max-w-container mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <TiltCard className="group h-full rounded-2xl" max={4} scale={1.012}>
                <div className="bg-white border border-border1 rounded-2xl p-7 transition-all hover:border-moss/25">
                  <div className="flex gap-0.5 mb-3.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <span key={k} className="text-[15px] text-amber-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="font-serif text-[17px] italic text-ink leading-snug mb-5">
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

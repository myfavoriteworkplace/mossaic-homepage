import Reveal from "./ui/Reveal";
import { MISSION, VISION } from "../data/site";

export default function Mission() {
  return (
    <section
      id="mission"
      className="bg-page"
      style={{ padding: "var(--section-pad-y) var(--pad)" }}
    >
      <div className="container-x">
        {/* Mission */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <Reveal className="lg:col-span-5">
            <div className="tag tag-green mb-4">{MISSION.tag}</div>
            <h2 className="section-title">
              Make great software <em className="underline-mark">boring</em>
              <br />
              for Indian businesses.
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={0.1}>
            <p className="text-[17px] leading-[1.75] text-ink-2 mb-8">
              {MISSION.body}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {MISSION.pillars.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border1 bg-page p-4"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                    <span className="text-[13px] font-semibold text-ink">
                      {p.title}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink-3 leading-snug">
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Vision — separated by hairline */}
        <div className="mt-16 pt-12 sm:mt-20 sm:pt-16 border-t border-border1 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <Reveal className="lg:col-span-5">
            <div className="tag tag-green mb-4">{VISION.tag}</div>
            <h2 className="section-title">
              Every Indian SMB on
              <br />
              <em className="underline-mark">world-class</em> software.
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={0.1}>
            <p className="text-[17px] leading-[1.75] text-ink-2">
              {VISION.body}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

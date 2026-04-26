import { Linkedin, Mail, MapPin, Calendar, Users, Target } from "lucide-react";
import Reveal from "./ui/Reveal";
import BookMySlotText from "./ui/BookMySlotText";
import { SITE, COMPANY } from "../data/site";

const FACTS = [
  { icon: <Calendar size={14} strokeWidth={1.8} />, label: "Founded", value: COMPANY.founded },
  { icon: <MapPin size={14} strokeWidth={1.8} />, label: "Headquarters", value: COMPANY.hq },
  { icon: <Users size={14} strokeWidth={1.8} />, label: "Team", value: COMPANY.team },
  { icon: <Target size={14} strokeWidth={1.8} />, label: "Focus", value: COMPANY.focus },
];

export default function About() {
  return (
    <section
      id="about"
      className="bg-surface"
      style={{ padding: "var(--section-pad-y) var(--pad)" }}
    >
      <div className="container-x">
        <div className="grid lg:[grid-template-columns:340px_1fr] gap-12 lg:gap-20 items-start">
          {/* Founder card + facts */}
          <Reveal>
            <div className="bg-page border border-border1 rounded-[20px] p-7 text-center max-w-[340px] mx-auto">
              <div
                className="relative w-[100px] h-[100px] rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--accent-soft-rgb)), rgb(var(--accent-mid-rgb)))",
                }}
              >
                <span
                  aria-hidden
                  className="absolute -inset-1 rounded-full border-2"
                  style={{ borderColor: "rgb(var(--accent-soft-rgb))" }}
                />
                <span className="display text-4xl font-bold text-moss-dark">
                  {SITE.founder.initials}
                </span>
              </div>
              <div className="text-lg font-semibold text-ink mb-1">
                {SITE.founder.name}
              </div>
              <div className="text-[13px] text-ink-3 mb-4">{SITE.founder.role}</div>
              <div className="flex justify-center gap-2.5">
                <a
                  href="https://linkedin.com/in/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-page hover:border-moss hover:text-moss transition-colors"
                >
                  <Linkedin size={12} />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-page hover:border-moss hover:text-moss transition-colors"
                >
                  <Mail size={12} />
                  Email
                </a>
              </div>
            </div>

            <div className="mt-5 max-w-[340px] mx-auto bg-page border border-border1 rounded-[20px] p-5">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-ink-4 mb-3">
                Company at a glance
              </div>
              <div className="flex flex-col gap-2.5">
                {FACTS.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-surface text-moss flex items-center justify-center flex-shrink-0">
                      {f.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] text-ink-3 uppercase tracking-wider">
                        {f.label}
                      </div>
                      <div className="text-[13px] font-medium text-ink leading-tight">
                        {f.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* About story */}
          <Reveal delay={0.1}>
            <div className="tag tag-green mb-5">About Mossaic</div>
            <h2 className="section-title text-left">
              Started with one real
              <br />
              problem. <em className="underline-mark">Still solving it.</em>
            </h2>
            <p className="text-[15px] text-ink-2 leading-[1.85] mb-4 mt-6">
              Mossaic began because we watched dental clinics in Kerala
              running their entire patient workflow on WhatsApp groups, paper
              registers, and phone calls that never got returned. The software
              available was either too complex, too expensive, or built for
              markets that don't look anything like an Indian clinic.
            </p>
            <p className="text-[15px] text-ink-2 leading-[1.85] mb-4">
              That problem became <BookMySlotText /> — our
              first product, live and serving real clinics every day. But the
              underlying problem isn't dental. It's every Indian SMB sitting
              between WhatsApp and Excel, waiting for software that fits how
              they actually work.
            </p>
            <p className="text-[15px] text-ink-2 leading-[1.85]">
              Mossaic is the company behind <BookMySlotText /> and everything coming
              after it — Retail CRM next, AI Imaging after that. The plan is
              simple: find industries running on workarounds, build software
              that fits, and ship it with the kind of compliance and craft
              that makes it worth switching from the workaround.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

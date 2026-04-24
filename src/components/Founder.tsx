import { Linkedin, Mail } from "lucide-react";
import Reveal from "./ui/Reveal";
import { SITE } from "../data/site";

export default function Founder() {
  return (
    <section
      id="founder"
      className="bg-white"
      style={{ padding: "100px var(--pad)" }}
    >
      <div className="max-w-container mx-auto grid lg:[grid-template-columns:340px_1fr] gap-12 lg:gap-20 items-center">
        <Reveal>
          <div className="bg-surface border border-border1 rounded-[20px] p-8 text-center max-w-[340px] mx-auto">
            <div
              className="relative w-[100px] h-[100px] rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--moss-light), var(--moss-mid))",
              }}
            >
              <span
                aria-hidden
                className="absolute -inset-1 rounded-full border-2 border-moss-light"
              />
              <span className="font-serif text-4xl text-moss-dark">
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
                className="flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-white hover:border-moss hover:text-moss transition-colors"
              >
                <Linkedin size={12} />
                LinkedIn
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-white hover:border-moss hover:text-moss transition-colors"
              >
                <Mail size={12} />
                Email
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="tag tag-green mb-5">The story</div>
          <h2
            className="font-serif text-ink mb-5 leading-tight tracking-tight"
            style={{ fontSize: "clamp(26px, 3vw, 38px)" }}
          >
            Started with one real
            <br />
            problem. <em className="text-moss italic">Still solving it.</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.8] mb-4">
            Mossaic started because I watched dental clinics in Kerala running
            their entire patient workflow on WhatsApp groups, paper registers,
            and phone calls that never got returned. The software available was
            either too complex, too expensive, or built for markets that don't
            look anything like an Indian clinic.
          </p>
          <p className="text-[15px] text-ink-2 leading-[1.8] mb-4">
            bookMySlot was built to solve that exact problem — a complete
            practice management platform that any clinic can set up in minutes,
            with no training required, no setup fees, and no data leaving India.
            It's live, it's working, and real clinics are using it every day.
          </p>
          <p className="text-[15px] text-ink-2 leading-[1.8]">
            Mossaic is the company behind bookMySlot and everything that comes
            after it. The plan is simple: find industries running on workarounds,
            build software that actually fits how they work, and do it with the
            kind of compliance and design quality that makes it worth switching.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

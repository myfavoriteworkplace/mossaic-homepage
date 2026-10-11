import {
  Fragment,
  type PointerEvent as ReactPointerEvent,
  useState,
} from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Linkedin, Mail, MapPin, Calendar, Users, Target } from "lucide-react";
import "./About.css";
import Reveal from "./ui/Reveal";
import BookMySlotText from "./ui/BookMySlotText";
import { SITE, COMPANY } from "../data/site";

const STORY_HEADING_VARIANTS: Variants = {
  hidden: (reducedMotion: boolean) =>
    reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  show: (reducedMotion: boolean) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const STORY_COPY_VARIANTS: Variants = {
  hidden: {},
  show: (reducedMotion: boolean) => ({
    transition: {
      delayChildren: reducedMotion ? 0 : 0.14,
      staggerChildren: reducedMotion ? 0 : 0.11,
    },
  }),
};

const STORY_PARAGRAPH_VARIANTS: Variants = {
  hidden: (reducedMotion: boolean) =>
    reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
  show: (reducedMotion: boolean) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const FACTS = [
  { icon: <Calendar size={14} strokeWidth={1.8} />, label: "Founded", value: COMPANY.founded },
  { icon: <MapPin size={14} strokeWidth={1.8} />, label: "Headquarters", value: COMPANY.hq },
  { icon: <Users size={14} strokeWidth={1.8} />, label: "Team", value: COMPANY.team },
  { icon: <Target size={14} strokeWidth={1.8} />, label: "Focus", value: COMPANY.focus },
];

export default function About() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [portraitAvailable, setPortraitAvailable] = useState(true);
  const [founderTitle, ...companyParts] = SITE.founder.role.split(" · ");
  const roleNodes = founderTitle.split(" & ");
  const companyLabel = companyParts.join(" · ");

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      prefersReducedMotion ||
      (event.pointerType !== "mouse" && event.pointerType !== "pen")
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--about-spotlight-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--about-spotlight-y",
      `${event.clientY - bounds.top}px`,
    );
    event.currentTarget.dataset.spotlightActive = "true";
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.dataset.spotlightActive = "false";
  };

  return (
    <section
      id="about"
      className="about-section bg-surface"
      style={{ padding: "var(--section-pad-y) var(--pad)" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="about-spotlight" aria-hidden="true" />
      <div className="about-geometry" aria-hidden="true">
        <svg viewBox="0 0 1160 680" preserveAspectRatio="xMidYMid slice">
          <g className="about-geometry__cluster about-geometry__cluster--left">
            <path d="M115 222 157 198 199 222 199 270 157 294 115 270Z" />
            <path d="M199 270 241 246 283 270 283 318 241 342 199 318Z" />
            <path d="M115 318 157 294 199 318 199 366 157 390 115 366Z" />
            <path d="M199 366 241 342 283 366 283 414 241 438 199 414Z" />
          </g>
          <g className="about-geometry__cluster about-geometry__cluster--right">
            <path d="M852 122 890 100 928 122 928 166 890 188 852 166Z" />
            <path d="M928 166 966 144 1004 166 1004 210 966 232 928 210Z" />
            <path d="M890 254 928 232 966 254 966 298 928 320 890 298Z" />
            <path d="M966 298 1004 276 1042 298 1042 342 1004 364 966 342Z" />
          </g>
        </svg>
      </div>

      <div className="container-x about-content">
        <div className="grid lg:[grid-template-columns:340px_1fr] gap-12 lg:gap-20 items-start">
          {/* Founder card + facts */}
          <Reveal>
            <div className="about-founder-card bg-page border border-border1 rounded-[20px] p-7 text-center max-w-[340px] mx-auto">
              <div
                className="about-founder-avatar relative w-[112px] h-[112px] mx-auto mb-4 flex items-center justify-center"
                data-testid="avatar-founder"
              >
                {portraitAvailable ? (
                  <img
                    className="about-founder-avatar__portrait"
                    src="/brand/founder-portrait.png"
                    alt={`Portrait of ${SITE.founder.name}`}
                    onError={() => setPortraitAvailable(false)}
                    loading="lazy"
                    decoding="async"
                    data-testid="image-founder-portrait"
                  />
                ) : (
                  <span
                    className="about-founder-avatar__initials display text-4xl font-bold text-moss-dark"
                    data-testid="avatar-founder-initials"
                  >
                    {SITE.founder.initials}
                  </span>
                )}
                <svg
                  className="about-founder-avatar__frame"
                  viewBox="0 0 112 112"
                  aria-hidden="true"
                  focusable="false"
                >
                  <polygon
                    className="about-founder-avatar__frame-base"
                    points="28,3 84,3 109,56 84,109 28,109 3,56"
                  />
                  <polygon
                    className="about-founder-avatar__frame-segments"
                    points="28,3 84,3 109,56 84,109 28,109 3,56"
                  />
                </svg>
                <span
                  className="about-founder-avatar__shard about-founder-avatar__shard--one"
                  aria-hidden="true"
                />
                <span
                  className="about-founder-avatar__shard about-founder-avatar__shard--two"
                  aria-hidden="true"
                />
                <span
                  className="about-founder-avatar__shard about-founder-avatar__shard--three"
                  aria-hidden="true"
                />
              </div>
              <div
                className="text-lg font-semibold text-ink mb-1"
                data-testid="text-founder-name"
              >
                {SITE.founder.name}
              </div>
              <div className="about-role text-[13px] text-ink-3 mb-4">
                <span className="sr-only" data-testid="text-founder-role">
                  {SITE.founder.role}
                </span>
                <span className="about-role__signal" aria-hidden="true">
                  {roleNodes.map((role, index) => (
                    <Fragment key={role}>
                      {index > 0 && (
                        <span className="about-role__connector">
                          <span />
                        </span>
                      )}
                      <span className="about-role__node">{role}</span>
                    </Fragment>
                  ))}
                </span>
                {companyLabel && (
                  <span className="about-role__company" aria-hidden="true">
                    · {companyLabel}
                  </span>
                )}
              </div>
              <div className="flex justify-center gap-2.5">
                <a
                  href="https://linkedin.com/in/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="about-social-link flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-page hover:border-moss hover:text-moss transition-colors"
                  data-testid="link-founder-linkedin"
                >
                  <Linkedin size={12} />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${SITE.email}`}
                  className="about-social-link flex items-center gap-1.5 text-xs text-ink-3 no-underline px-3 py-1.5 rounded-md border border-border1 bg-page hover:border-moss hover:text-moss transition-colors"
                  data-testid="link-founder-email"
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
                  <div
                    key={f.label}
                    className="about-fact flex items-center gap-2.5"
                    data-testid={`row-company-fact-${f.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
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
            <motion.h2
              className="section-title text-left about-story-heading"
              variants={STORY_HEADING_VARIANTS}
              custom={prefersReducedMotion}
              data-testid="heading-about-story"
            >
              Started with one real
              <br />
              problem.{" "}
              <em className="underline-mark about-story-highlight">
                Still solving it.
              </em>
            </motion.h2>
            <motion.div
              className="about-story-copy"
              variants={STORY_COPY_VARIANTS}
              custom={prefersReducedMotion}
            >
              <motion.p
                className="text-[15px] text-ink-2 leading-[1.85] mb-4 mt-6"
                variants={STORY_PARAGRAPH_VARIANTS}
                custom={prefersReducedMotion}
              >
                Mossaic began because we watched dental clinics in Kerala
                running their entire patient workflow on WhatsApp groups, paper
                registers, and phone calls that never got returned. The software
                available was either too complex, too expensive, or built for
                markets that don't look anything like an Indian clinic.
              </motion.p>
              <motion.p
                className="text-[15px] text-ink-2 leading-[1.85] mb-4"
                variants={STORY_PARAGRAPH_VARIANTS}
                custom={prefersReducedMotion}
              >
                That problem became <BookMySlotText /> — our first product, live
                and serving real clinics every day. But the underlying problem
                isn't dental. It's every Indian SMB sitting between WhatsApp
                and Excel, waiting for software that fits how they actually
                work.
              </motion.p>
              <motion.p
                className="text-[15px] text-ink-2 leading-[1.85]"
                variants={STORY_PARAGRAPH_VARIANTS}
                custom={prefersReducedMotion}
              >
                Mossaic is the company behind <BookMySlotText /> and everything
                coming after it — Retail CRM next, AI Imaging after that. The
                plan is simple: find industries running on workarounds, build
                software that fits, and ship it with the kind of compliance and
                craft that makes it worth switching from the workaround.
              </motion.p>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

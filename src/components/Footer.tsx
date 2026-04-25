import { Linkedin, Twitter, Github } from "lucide-react";
import Logo from "./Logo";
import Wordmark from "./ui/Wordmark";
import BookMySlotText from "./ui/BookMySlotText";
import { TAGLINE } from "../data/site";

const COLS: {
  title: string;
  links: { label: React.ReactNode; href: string }[];
}[] = [
  {
    title: "Products",
    links: [
      { label: <BookMySlotText />, href: "https://bookmyslot.dental.mossaic.in" },
      { label: "Retail CRM", href: "#products" },
      { label: "AI Imaging", href: "#products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Mission", href: "#mission" },
      { label: "About", href: "#about" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Why Mossaic", href: "#why" },
      { label: "Compliance", href: "#why" },
      { label: "Customer stories", href: "#testimonials" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--moss-deeper)",
        padding: "60px var(--pad) 36px",
        borderTop: "1px solid rgba(34,211,238,0.12)",
      }}
    >
      <div className="max-w-container mx-auto">
        <div className="grid gap-12 md:grid-cols-2 lg:[grid-template-columns:1.5fr_1fr_1fr_1fr] mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <Logo size={56} idSuffix="footer" />
              <Wordmark variant="footer" textColor="#fff" />
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed mb-5 max-w-xs">
              Building modular, India-first SaaS for industries that have
              been underserved by generic software. Explainable AI at the core.
            </p>
            <div className="flex gap-2">
              {[
                { icon: <Linkedin size={14} />, href: "https://linkedin.com" },
                { icon: <Twitter size={14} />, href: "https://twitter.com" },
                { icon: <Github size={14} />, href: "https://github.com" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-8 h-8 rounded-md bg-white/5 border border-white/10 hover:bg-moss/20 hover:border-[rgba(34,211,238,0.35)] flex items-center justify-center text-white/50 hover:text-white transition-all"
                  aria-label="Social link"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-white/30 mb-4">
                {col.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {col.links.map((l, i) => (
                  <a
                    key={`${col.title}-${i}`}
                    href={l.href}
                    className="text-[13px] text-white/45 hover:text-white/85 no-underline transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex items-center justify-between flex-wrap gap-3">
          <span className="display text-sm text-white/50 tracking-tight">
            {TAGLINE}
          </span>
          <span className="text-xs text-white/25">
            © {new Date().getFullYear()} Mossaic Technologies. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

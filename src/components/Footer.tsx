import { Linkedin, Twitter, Github } from "lucide-react";
import Logo from "./Logo";

const COLS = [
  {
    title: "Products",
    links: [
      { label: "bookMySlot", href: "https://bookmyslot.dental.mossaic.in" },
      { label: "Retail CRM", href: "#products" },
      { label: "AI Imaging", href: "#products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#founder" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Compliance", href: "#why" },
      { label: "Tech stack", href: "#why" },
      { label: "Testimonials", href: "#testimonials" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--moss-deeper)",
        padding: "60px var(--pad) 36px",
        borderTop: "1px solid rgba(86,201,158,0.1)",
      }}
    >
      <div className="max-w-container mx-auto">
        <div className="grid gap-12 md:grid-cols-2 lg:[grid-template-columns:1.5fr_1fr_1fr_1fr] mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-[30px] h-[30px] rounded-md bg-moss flex items-center justify-center">
                <Logo size={16} />
              </span>
              <span className="font-serif text-lg text-white">
                mos<span className="text-moss-mid italic">saic</span>
              </span>
            </div>
            <p className="text-[13px] text-white/35 leading-relaxed mb-5 max-w-xs">
              Building modular, India-first SaaS for industries that have been
              underserved by generic software.
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
                  className="w-8 h-8 rounded-md bg-white/5 border border-white/10 hover:bg-moss/20 hover:border-[rgba(86,201,158,0.3)] flex items-center justify-center text-white/50 hover:text-white transition-all"
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
                {col.links.map((l) => (
                  <a
                    key={l.label}
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
          <span className="font-serif text-sm italic text-white/30">
            Modular. Compliant. Built for India.
          </span>
          <span className="text-xs text-white/20">
            © {new Date().getFullYear()} Mossaic Technologies. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

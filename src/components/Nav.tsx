import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";
import { NAV_LINKS } from "../data/site";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-[1000] h-[60px] flex items-center transition-all ${
        scrolled
          ? "bg-[rgba(7,24,18,0.88)] border-b border-[rgba(86,201,158,0.15)] backdrop-blur-[14px]"
          : "bg-transparent"
      }`}
      style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
    >
      <div className="max-w-container w-full mx-auto flex items-center gap-10">
        <a href="#" className="flex items-center gap-2.5 no-underline">
          <span className="relative w-8 h-8 rounded-lg bg-moss flex items-center justify-center overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
            <Logo size={18} />
          </span>
          <span className="font-serif text-xl text-white tracking-tight">
            mos<span className="text-moss-mid italic">saic</span>
          </span>
        </a>

        <div className="hidden md:flex gap-7 ml-auto">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-white/55 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="bg-moss hover:bg-moss-dark transition-colors text-white rounded-lg px-[18px] py-2 text-[13px] font-medium no-underline ml-auto md:ml-0"
        >
          Get started
        </a>
      </div>
    </motion.nav>
  );
}

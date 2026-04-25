import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";
import Wordmark from "./ui/Wordmark";
import ThemeSwitcher from "./ui/ThemeSwitcher";
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
          ? "bg-[rgba(7,16,32,0.85)] border-b border-[rgba(34,211,238,0.15)] backdrop-blur-[14px]"
          : "bg-transparent"
      }`}
      style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
    >
      <div className="max-w-container w-full mx-auto flex items-center gap-8">
        <a href="#" className="flex items-center gap-2.5 no-underline">
          <Logo size={44} variant="image" />
          <Wordmark variant="nav" textColor="#fff" />
        </a>

        <div className="hidden md:flex gap-6 ml-auto">
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

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <ThemeSwitcher surface="dark" />
          <a
            href="#contact"
            className="bg-moss hover:bg-moss-dark transition-colors text-white rounded-lg px-[16px] py-2 text-[13px] font-semibold no-underline"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

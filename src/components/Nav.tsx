import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Wordmark from "./ui/Wordmark";
import ThemeSwitcher from "./ui/ThemeSwitcher";
import { NAV_LINKS } from "../data/site";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile menu on Escape and lock body scroll while open. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 inset-x-0 z-[1000] h-[60px] flex items-center transition-all ${
          scrolled || menuOpen
            ? "bg-[rgba(7,16,32,0.85)] border-b border-[rgba(34,211,238,0.15)] backdrop-blur-[14px]"
            : "bg-transparent"
        }`}
        style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
      >
        <div className="max-w-container w-full mx-auto flex items-center gap-4 md:gap-8">
          <a
            href="#"
            className="flex items-center gap-2.5 no-underline"
            onClick={() => setMenuOpen(false)}
          >
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
              className="hidden sm:inline-block bg-moss hover:bg-moss-dark transition-colors text-white rounded-lg px-[16px] py-2 text-[13px] font-semibold no-underline"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-sheet"
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 hover:text-white hover:border-white/30 transition-colors"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile nav sheet (md:hidden) ───────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              key="mobile-nav-backdrop"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden fixed inset-0 z-[990] bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              id="mobile-nav-sheet"
              key="mobile-nav-sheet"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="md:hidden fixed top-[60px] inset-x-0 z-[995] border-b border-[rgba(34,211,238,0.15)]"
              style={{
                background: "rgba(7,16,32,0.96)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                paddingLeft: "var(--pad)",
                paddingRight: "var(--pad)",
              }}
            >
              <div className="max-w-container mx-auto py-4 flex flex-col">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-[15px] text-white/80 hover:text-white py-3 border-b border-white/5 last:border-b-0 no-underline transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="sm:hidden mt-4 inline-flex items-center justify-center bg-moss hover:bg-moss-dark transition-colors text-white rounded-lg px-4 py-3 text-[14px] font-semibold no-underline"
                >
                  Get started
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

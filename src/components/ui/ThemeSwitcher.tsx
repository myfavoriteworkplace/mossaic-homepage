import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Circle, Check, ChevronDown } from "lucide-react";
import { THEMES, applyTheme, readTheme, type ThemeId } from "../../styles/themes";

const ICONS: Record<ThemeId, JSX.Element> = {
  light: <Sun size={14} strokeWidth={1.8} />,
  dark: <Moon size={14} strokeWidth={1.8} />,
  mono: <Circle size={14} strokeWidth={1.8} />,
};

type Props = {
  /** "dark" matches buttons/links rendered on a dark hero/nav surface; "light" matches white surfaces. */
  surface?: "dark" | "light";
};

export default function ThemeSwitcher({ surface = "dark" }: Props) {
  const [theme, setTheme] = useState<ThemeId>("light");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const choose = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  const isDark = surface === "dark";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Switch theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors border ${
          isDark
            ? "bg-white/[0.06] hover:bg-white/[0.1] border-white/10 hover:border-white/25 text-white/75 hover:text-white"
            : "bg-page hover:bg-surface border-border1 hover:border-moss/40 text-ink-2 hover:text-ink"
        }`}
      >
        {ICONS[theme]}
        <span className="hidden sm:inline">
          {THEMES.find((t) => t.id === theme)?.label}
        </span>
        <ChevronDown size={12} className="opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 rounded-xl border border-border1 bg-page shadow-xl shadow-black/10 overflow-hidden z-50"
          >
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(t.id)}
                  className={`w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                    active ? "bg-surface" : "hover:bg-surface"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-md ${
                      active ? "bg-moss text-white" : "bg-surface text-ink-3"
                    }`}
                  >
                    {ICONS[t.id]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-ink leading-tight">
                      {t.label}
                    </span>
                    <span className="block text-[11px] text-ink-3 mt-0.5 leading-snug">
                      {t.description}
                    </span>
                  </span>
                  {active && <Check size={14} className="text-moss mt-1" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type ThemeId = "aurora" | "light" | "moss" | "mono";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
};

export const THEMES: ThemeMeta[] = [
  { id: "aurora", label: "Aurora", description: "Deep navy with cyan AI glow — default" },
  { id: "light", label: "Light", description: "Clean white surface, cyan accents" },
  { id: "moss", label: "Moss", description: "The original Mossaic green" },
  { id: "mono", label: "Mono", description: "Neutral grays with a single cyan accent" },
];

export const STORAGE_KEY = "mossaic-theme";
export const DEFAULT_THEME: ThemeId = "aurora";

const VALID_IDS = new Set<ThemeId>(["aurora", "light", "moss", "mono"]);

function normalize(id: string | null): ThemeId {
  if (!id) return DEFAULT_THEME;
  // Migrate legacy "dark" stored values to "aurora"
  if (id === "dark") return "aurora";
  return VALID_IDS.has(id as ThemeId) ? (id as ThemeId) : DEFAULT_THEME;
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function readTheme(): ThemeId {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attr = document.documentElement.getAttribute("data-theme");
  return normalize(attr);
}

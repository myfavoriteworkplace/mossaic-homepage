export type ThemeId = "light" | "dark" | "mono";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
};

export const THEMES: ThemeMeta[] = [
  { id: "light", label: "Light", description: "Mossaic moss on clean white" },
  { id: "dark", label: "Dark", description: "Deep moss with bright accents" },
  { id: "mono", label: "Mono", description: "Neutral grays, single green accent" },
];

export const STORAGE_KEY = "mossaic-theme";

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function readTheme(): ThemeId {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme") as ThemeId | null;
  return attr ?? "light";
}

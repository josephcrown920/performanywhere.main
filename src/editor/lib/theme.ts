/** Browser-local studio themes. Applied as data-theme on <html>; no permissions involved. */
export const THEMES = [
  { id: "crimson", label: "Crimson" },
  { id: "midnight", label: "Midnight blue" },
  { id: "emerald", label: "Emerald" },
  { id: "sunset", label: "Sunset" },
  { id: "mono", label: "Mono" },
  { id: "daylight", label: "Daylight" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
const KEY = "reel-theme";

export function readTheme(): ThemeId {
  if (typeof localStorage === "undefined") return "crimson";
  const t = localStorage.getItem(KEY);
  return THEMES.some((x) => x.id === t) ? (t as ThemeId) : "crimson";
}
export function applyTheme(id: ThemeId) {
  document.documentElement.dataset["theme"] = id;
  localStorage.setItem(KEY, id);
}

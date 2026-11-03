const KEY = "reel-creative-context";
const STYLE = "reel-moodboard";

export function readCreativeContext(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function saveCreativeContext(value: string) {
  try { window.localStorage.setItem(KEY, value.slice(0, 6000)); } catch { /* Storage may be unavailable. */ }
}

export function withCreativeContext(prompt: string): string {
  const context = readCreativeContext().trim();
  let style = "";
  try { style = window.localStorage.getItem(STYLE) ?? ""; } catch { /* Storage may be unavailable. */ }
  const withContext = context ? `${prompt}\n\nCREATIVE CONTEXT (reference preferences; the current request takes priority):\n${context}` : prompt;
  const notes = readNotebook().trim();
  const withNotes = notes ? `${withContext}\n\nPROJECT NOTEBOOK (progress so far; the current request takes priority):\n${notes.slice(-3000)}` : withContext;
  return style ? `${withNotes}\n\n${style}` : withNotes;
}
const NOTEBOOK = "reel-project-notebook";

export function readNotebook(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(NOTEBOOK) ?? ""; } catch { return ""; }
}

export function saveNotebook(value: string) {
  try { window.localStorage.setItem(NOTEBOOK, value.slice(-8000)); } catch { /* Storage may be unavailable. */ }
}

/** Automatically records project progress so later requests keep continuity. */
export function appendNotebook(entry: string) {
  const line = `• ${new Date().toISOString().slice(0, 16).replace("T", " ")} — ${entry.trim().slice(0, 300)}`;
  saveNotebook(`${readNotebook()}\n${line}`.trim());
}

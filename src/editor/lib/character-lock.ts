/** Browser-saved character lock: reference photos + identity notes sent with every generation. */
const KEY = "reel-character-lock";
export const MAX_CHARACTER_REFS = 4;

export type CharacterLock = { on: boolean; name: string; notes: string; refs: { id: string; url: string }[] };

const EMPTY: CharacterLock = { on: false, name: "", notes: "", refs: [] };

export function readCharacterLock(): CharacterLock {
  if (typeof window === "undefined") return EMPTY;
  try { return { ...EMPTY, ...(JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Partial<CharacterLock>) }; } catch { return EMPTY; }
}

export function saveCharacterLock(lock: CharacterLock) {
  try { window.localStorage.setItem(KEY, JSON.stringify({ ...lock, notes: lock.notes.slice(0, 2000), refs: lock.refs.slice(0, MAX_CHARACTER_REFS) })); } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new Event("character-lock"));
}

export function toggleCharacterRef(lock: CharacterLock, ref: { id: string; url: string }): CharacterLock {
  const has = lock.refs.some((r) => r.id === ref.id);
  if (has) return { ...lock, refs: lock.refs.filter((r) => r.id !== ref.id) };
  if (lock.refs.length >= MAX_CHARACTER_REFS) return lock;
  return { ...lock, on: true, refs: [...lock.refs, ref] };
}

/** Identity instruction appended to prompts when the lock is active. */
export function characterGuide(lock: CharacterLock): string {
  if (!lock.on || !lock.refs.length) return "";
  const who = lock.name.trim() || "the main character";
  return `CHARACTER LOCK: the attached reference photos show ${who}. Keep this exact person in every frame: same face shape, skin tone, hairstyle and hair colour, body build, and tattoos only in the exact positions shown in the references — never invent, move, mirror or drop tattoos. Do not drift the face between frames.${lock.notes.trim() ? `\nIdentity notes (authoritative): ${lock.notes.trim()}` : ""}`;
}

export function isCharacterLocked(lock: CharacterLock) {
  return lock.on && lock.refs.length > 0;
}

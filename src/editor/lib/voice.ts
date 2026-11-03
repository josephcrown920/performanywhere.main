/** Free spoken replies using the browser's built-in voices. Settings live in this browser. */
const KEY = "reel-voice-settings";
export type VoiceSettings = { voice: string; volume: number; rate: number; pitch: number };
export const DEFAULT_VOICE: VoiceSettings = { voice: "", volume: 0.6, rate: 1, pitch: 1.1 };

/** Softer, lighter voices first. */
const PREFERRED = ["Samantha", "Ava", "Allison", "Victoria", "Karen", "Moira", "Tessa", "Serena", "Google UK English Female", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Microsoft Sonia", "Zira"];

export function readVoice(): VoiceSettings {
  try { return { ...DEFAULT_VOICE, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<VoiceSettings>) }; } catch { return DEFAULT_VOICE; }
}
export function saveVoice(v: VoiceSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const rank = (v: SpeechSynthesisVoice) => { const i = PREFERRED.findIndex((p) => v.name.includes(p)); return i < 0 ? 99 : i; };
  return [...all].sort((a, b) => rank(a) - rank(b));
}

export function speak(text: string, s: VoiceSettings = readVoice()) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = listVoices();
  const v = voices.find((x) => x.name === s.voice) ?? voices[0];
  if (v) u.voice = v;
  u.volume = s.volume; u.rate = s.rate; u.pitch = s.pitch;
  window.speechSynthesis.speak(u);
}

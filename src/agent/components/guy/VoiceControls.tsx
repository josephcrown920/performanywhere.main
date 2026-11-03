import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { listVoices, readVoice, saveVoice, speak, type VoiceSettings } from "@/agent/lib/guy/voice";

/** Voice picker + volume for spoken replies; sits in the chat box. */
export function VoiceControls() {
  const [s, setS] = useState<VoiceSettings>(readVoice());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
  }, []);
  const update = (patch: Partial<VoiceSettings>) => { const n = { ...s, ...patch }; setS(n); saveVoice(n); };
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
      <Volume2 className="size-3" />
      <select aria-label="Reply voice" value={s.voice} onChange={(e) => { update({ voice: e.target.value }); speak("Hey, this is my voice.", { ...s, voice: e.target.value }); }} className="max-w-36 rounded-md border border-border bg-card px-1.5 py-1 text-[10px]">
        <option value="">Smooth (auto)</option>
        {voices.map((v) => <option key={v.name} value={v.name}>{v.name.replace(/^(Microsoft|Google) /, "")}</option>)}
      </select>
    </div>
  );
}

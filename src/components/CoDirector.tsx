import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Send, Clapperboard, Play } from "lucide-react";
import { toast } from "sonner";

export type CoDirectorShot = {
  title?: string;
  prompt: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  duration?: 5 | 10;
  category?: string;
  capabilities?: string[];
};
type Msg = { role: "user" | "assistant"; content: string; shot?: CoDirectorShot | null };

const STARTERS = [
  "Night rooftop in Lagos, slow push-in while I rap",
  "Moody rain scene for a love song, 16:9",
  "Hype dance shot in a neon warehouse",
];

export default function CoDirector({ onApply, busy, context }: { onApply: (s: CoDirectorShot, go: boolean) => void; busy: boolean; context: Record<string, unknown> }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "I'm your co-director. Tell me the song, the vibe and where you want to perform — I'll write a cinematic shot you can generate right here." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, loading]);

  async function send(text: string) {
    const t = text.trim(); if (!t || loading) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/agent/co-director", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), context }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "The co-director is unavailable");
      const shot = j.shot && typeof j.shot.prompt === "string" ? (j.shot as CoDirectorShot) : null;
      setMsgs((m) => [...m, { role: "assistant", content: j.reply + (shot ? `\n\nShot: ${shot.prompt}` : ""), shot }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Co-director failed");
      setMsgs((m) => m.slice(0, -1)); setInput(t);
    } finally { setLoading(false); }
  }

  return (
    <aside className="pa-panel flex h-[calc(100vh-7rem)] flex-col overflow-hidden xl:sticky xl:top-20">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src="/pa-mark.svg" alt="" className="h-8 w-8" />
        <div className="leading-tight">
          <div className="font-display text-lg tracking-wide">CO-DIRECTOR</div>
          <div className="text-[11px] text-muted-foreground">Works beside you on this shoot</div>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground" : "mr-4"}>
            {m.role === "assistant" ? (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap text-foreground/90">{m.shot ? m.content.split("\n\nShot:")[0] : m.content}</p>
                {m.shot && (
                  <div className="rounded-xl border border-primary/40 bg-background p-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"><Clapperboard className="h-3 w-3" />{m.shot.title || "Shot"} · {m.shot.aspectRatio ?? "9:16"} · {m.shot.duration ?? 5}s</div>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/80">{m.shot.prompt}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => onApply(m.shot!, false)} className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs hover:bg-accent">Use this shot</button>
                      <button disabled={busy} onClick={() => onApply(m.shot!, true)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}Generate</button>
                    </div>
                  </div>
                )}
              </div>
            ) : m.content}
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Blocking the shot…</div>}
        {msgs.length === 1 && (
          <div className="flex flex-col gap-2 pt-2">
            {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">{s}</button>)}
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-border p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your vision…" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <button disabled={loading || !input.trim()} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-40" aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, ImageIcon, Loader2, Mic2, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateVideo } from "@/editor/lib/generate";
import { readSse } from "@/editor/lib/agent-stream";
import { CreativeContext } from "@/editor/components/CreativeContext";

const ENGINES = [
  { id: "omni", label: "Gemini Omni (built-in)" },
  { id: "omnihuman", label: "OmniHuman 1.5 (ModelArk key)" },
];

async function toJpeg(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    await new Promise<void>((res, rej) => { el.onload = () => res(); el.onerror = () => rej(); el.src = url; });
    const scale = Math.min(1, 768 / Math.max(el.width, el.height));
    const c = document.createElement("canvas");
    c.width = Math.round(el.width * scale); c.height = Math.round(el.height * scale);
    c.getContext("2d")?.drawImage(el, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
  } finally { URL.revokeObjectURL(url); }
}

/** Lip sync studio: face photo + voice track, with an agent that directs the performance. */
export function LipSync({ onDone }: { onDone: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [face, setFace] = useState<File>();
  const [audio, setAudio] = useState<File>();
  const [faceUrl, setFaceUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [line, setLine] = useState("");
  const [engine, setEngine] = useState("omni");
  const [useAgent, setUseAgent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => { if (!face) return; const u = URL.createObjectURL(face); setFaceUrl(u); return () => URL.revokeObjectURL(u); }, [face]);
  useEffect(() => { if (!audio) return; const u = URL.createObjectURL(audio); setAudioUrl(u); return () => URL.revokeObjectURL(u); }, [audio]);

  /** Agent step: looks at the face and the brief, writes the performance direction. */
  async function direct(): Promise<string> {
    if (!face) return "";
    setStatus("Lip sync agent is studying your references…");
    const data = await toJpeg(face);
    const r = await fetch("/api/ed/agent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: "gemini", assets: [], clips: [],
        images: [{ name: face.name, data, mime: "image/jpeg" }],
        brief: `You are a lip-sync performance director. Study the attached face photo. The voice track is "${audio?.name ?? "audio"}". Brief: ${line || "natural, confident delivery"}. In "reply", write one paragraph (under 90 words) directing the performance: expression, emotion arc, eye line, head motion, framing and lighting that match the photo exactly. Keep the identity identical.`,
      }),
    });
    if (!r.ok || !r.body) return "";
    let reply = "";
    await readSse(r.body, (event, raw) => {
      if (event === "done") reply = (JSON.parse(raw) as { reply?: string }).reply ?? "";
    });
    return reply;
  }

  async function run() {
    if (!face || !audio || busy) return;
    setBusy(true);
    try {
      const direction = useAgent ? await direct() : "";
      setStatus("Rendering the talking clip…");
      const url = await generateVideo(
        `Lip sync: animate the person in the photo speaking the attached audio with accurate mouth shapes, natural blinks and subtle head motion. ${line}\n${direction}`,
        engine,
        "Static camera, close-up, face stays identical to the photo.",
        { image: face, audio, onStatus: (s) => setStatus(`Rendering… ${s}`) },
      );
      onDone(url);
      setStatus("Done — added to your timeline.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Lip sync failed.");
    } finally {
      setBusy(false);
    }
  }

  const box = "flex h-36 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed border-border bg-card/40 text-[11px] text-muted-foreground transition hover:border-primary";

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="flex h-8 min-w-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2 font-bold sm:px-2.5 sm:py-1.5 sm:text-xs">
        <Mic2 className="size-3.5" />
        <span className="hidden sm:inline">Lip sync</span>
      </Button>
      {open && createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-background/70 p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="Lip sync studio" className="glass-panel w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold"><Mic2 className="size-4 text-accent" /> Lip sync studio</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={box}>
                {faceUrl ? <img src={faceUrl} alt="Face reference" className="h-full w-full object-cover" /> : <><ImageIcon className="size-5" /> Drop or pick a face photo</>}
                <input type="file" accept="image/*" aria-label="Face photo" className="hidden" onChange={(e) => setFace(e.target.files?.[0])} />
              </label>
              <label className={box}>
                <Music className="size-5" />
                {audio ? <span className="max-w-full truncate px-3">{audio.name}</span> : "Drop or pick a voice / song"}
                {audioUrl && <audio src={audioUrl} controls className="mt-1 h-8 w-[90%]" onClick={(e) => e.preventDefault()} />}
                <input type="file" accept="audio/*" aria-label="Voice audio" className="hidden" onChange={(e) => setAudio(e.target.files?.[0])} />
              </label>
            </div>
            <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="Performance brief: mood, energy, setting… (optional)" className="min-h-16 w-full resize-y rounded-md border border-input bg-background p-3 text-xs outline-none focus:border-primary" />
            <CreativeContext />
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select aria-label="Lip sync engine" value={engine} onChange={(e) => setEngine(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs">
                {ENGINES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={useAgent} onChange={(e) => setUseAgent(e.target.checked)} /> <Bot className="size-3.5 text-accent" /> Lip sync agent directs it</label>
              <Button onClick={() => void run()} disabled={!face || !audio || busy} className="ml-auto">
                {busy && <Loader2 className="size-3.5 animate-spin" />} Make lip sync video
              </Button>
            </div>
            {status && <p role="status" className="text-xs text-muted-foreground">{status}</p>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

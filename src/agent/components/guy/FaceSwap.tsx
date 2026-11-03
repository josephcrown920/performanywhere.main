import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateImage } from "@/agent/lib/guy/generate";
import { IMAGE_ENGINES, DEFAULT_IMAGE_ENGINE } from "@/agent/lib/guy/engines";
import { Loader2, ScanFace } from "lucide-react";

export function FaceSwap({ onAsset }: { onAsset: (url: string, kind: "image" | "video", name: string) => void }) {
  const [target, setTarget] = useState<File>();
  const [face, setFace] = useState<File>();
  const [preview, setPreview] = useState<string[]>([]);
  const [engine, setEngine] = useState(DEFAULT_IMAGE_ENGINE);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => { const urls = [target, face].map((f) => f ? URL.createObjectURL(f) : ""); setPreview(urls); return () => urls.forEach((u) => { if (u) URL.revokeObjectURL(u); }); }, [target, face]);
  async function run() {
    if (!target || !face || !consent || busy) return;
    setBusy(true); setStatus("Editing the face…");
    try {
      const url = await generateImage("Edit the first image: replace only the main person's face with the consenting adult identity in the second image. Match original lighting, skin shading, head angle and expression. Keep hair, clothing, body, background and composition unchanged. Natural photographic result, no text.", engine, target, false, [face]);
      setResult(url); onAsset(url, "image", "face-swap.png"); setStatus("Face edit added to Generations.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Face edit failed."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4">
    <h2 className="flex items-center gap-2 font-semibold"><ScanFace className="size-4" />Face swap · image</h2>
    <div className="grid grid-cols-2 gap-3">{["Original image", "Face reference"].map((label, i) => <label key={label} className="flex min-w-0 flex-col gap-2 text-xs">
      {label}{preview[i] && <img src={preview[i]} alt={label} className="aspect-square w-full rounded-lg object-contain" />}
      <input aria-label={label} type="file" accept="image/*" className="w-full min-w-0" onChange={(e) => { if (i === 0) setTarget(e.target.files?.[0]); else setFace(e.target.files?.[0]); }} />
    </label>)}</div>
    <select aria-label="Face swap image engine" value={engine} onChange={(e) => setEngine(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 text-xs">{IMAGE_ENGINES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
    <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I have permission from the adults pictured to edit their likeness.</label>
    <Button disabled={!target || !face || !consent || busy} onClick={() => void run()}>{busy ? <Loader2 className="animate-spin" /> : <ScanFace />}Swap face</Button>
    {status && <p role="status" className="text-xs text-muted-foreground">{status}</p>}
    {result && <img src={result} alt="Face swap result" className="max-h-96 rounded-lg object-contain" />}
  </section>;
}
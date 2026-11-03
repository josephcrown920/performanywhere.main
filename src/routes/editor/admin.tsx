import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE, readSite, saveSite, type SiteSettings } from "@/editor/lib/site-settings";

export const Route = createFileRoute("/editor/admin")({
  head: () => ({
    meta: [
      { title: "Visual settings — Perform Anywhere Editor" },
      { name: "description", content: "Change the studio's words, images and default look." },
      { property: "og:title", content: "Visual settings — Perform Anywhere Editor" },
      { property: "og:description", content: "Change the studio's words, images and default look." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const TEXT: [keyof SiteSettings, string][] = [["brand", "Small label"], ["headline", "Headline"], ["accentWord", "Highlighted word"], ["tagline", "Tagline"], ["visualDirection", "Default visual direction"]];
const IMAGES: [keyof SiteSettings, string][] = [["heroImage", "Opening background"], ["tileEditor", "Editor tile"], ["tileCanvas", "Canvas tile"], ["tileLayers", "Layers tile"], ["tilePerform", "Perform tile"], ["tileWorkflows", "Workflows tile"]];

function shrink(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1600 / img.width);
      const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); rej(new Error("Could not open image canvas.")); return; }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Could not read this image.")); }; img.src = url;
  });
}

function Admin() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SITE);
  const [msg, setMsg] = useState("");
  useEffect(() => setS(readSite()), []);
  const set = (k: keyof SiteSettings, v: string | string[]) => setS((p) => ({ ...p, [k]: v }));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/editor" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3" /> Studio</Link>
      <h1 className="font-display text-3xl font-bold">Visual settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Personal customization for this browser only. These changes do not affect other visitors or the published site.</p>
      <section className="space-y-3 rounded-2xl border border-border glass-panel p-4">
        {TEXT.map(([k, label]) => (
          <label key={k} className="block text-xs font-semibold">{label}
            <textarea aria-label={label} rows={k === "tagline" || k === "visualDirection" ? 2 : 1} value={s[k] as string} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card/40 p-2 text-sm font-normal" />
          </label>
        ))}
        <label className="block text-xs font-semibold">Idea starters (one per line)
          <textarea rows={3} value={s.ideas.join("\n")} onChange={(e) => set("ideas", e.target.value.split("\n").filter(Boolean))} className="mt-1 w-full rounded-lg border border-border bg-card/40 p-2 text-sm font-normal" />
        </label>
      </section>
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IMAGES.map(([k, label]) => (
          <label key={k} className="relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">
            {s[k] ? <img src={s[k] as string} alt={label} className="absolute inset-0 size-full object-cover" /> : <Upload className="size-4" />}
            <span className="relative mt-auto w-full bg-background/70 py-1 text-center text-foreground">{label}</span>
            <input aria-label={label} type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { set(k, await shrink(f)); } catch (error) { setMsg(error instanceof Error ? error.message : "Image upload failed."); } } }} />
          </label>
        ))}
      </section>
      <div className="mt-5 flex gap-2">
        <Button onClick={() => { try { saveSite(s); setMsg("Saved."); } catch { setMsg("Too large to save — use smaller images."); } }}><Save /> Save</Button>
        <Button variant="outline" onClick={() => { setS(DEFAULT_SITE); saveSite(DEFAULT_SITE); setMsg("Reset to defaults."); }}><RotateCcw /> Reset</Button>
        <span role="status" className="self-center text-xs text-muted-foreground">{msg}</span>
      </div>
    </main>
  );
}

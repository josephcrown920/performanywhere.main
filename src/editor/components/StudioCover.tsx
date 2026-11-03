import { ArrowUpRight, Clapperboard, Film, Layers3, Plus, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE, readSite, type SiteSettings } from "@/editor/lib/site-settings";
import scene1 from "@/editor/assets/scene1.jpg";
import tileEditor from "@/editor/assets/tile-editor.png";
import tileCanvas from "@/editor/assets/tile-canvas.png";
import tileLayers from "@/editor/assets/tile-layers.png";
import tilePerform from "@/editor/assets/tile-perform.png";
import tileWorkflows from "@/editor/assets/tile-workflows.png";

type StudioMode = "edit" | "canvas" | "layers" | "workflows" | "perform";

const IDEAS = [
  "A 30-second music video teaser, neon rain, slow push-ins",
  "Product launch ad for a luxury perfume, gold hour",
  "Short film opening: a lone rider crossing a desert at dawn",
];

const MODES: { mode: StudioMode; label: string; copy: string; image: string; icon: typeof Film }[] = [
  { mode: "edit", label: "Editor", copy: "Timeline, EditPilot and smart fixes", image: tileEditor, icon: Clapperboard },
  { mode: "canvas", label: "Canvas", copy: "Node canvas with its own agent", image: tileCanvas, icon: Film },
  { mode: "layers", label: "Layers", copy: "Change one part, keep the rest", image: tileLayers, icon: Layers3 },
  { mode: "perform", label: "Perform", copy: "Perform anywhere, motion & style transfer", image: tilePerform, icon: Film },
  { mode: "workflows", label: "Workflows", copy: "ComfyUI, Genjutsu and Blender pipelines", image: tileWorkflows, icon: Workflow },
];

/** Opening screen: prompt-first, with the chat in the centre. */
export function StudioCover({
  children,
  onWorkspace,
  onNew,
  onIdea,
  onMode,
  userName,
  onName,
}: {
  children: React.ReactNode;
  onWorkspace: () => void;
  onNew: () => void;
  onIdea: (idea: string) => void;
  onMode: (mode: StudioMode) => void;
  userName: string;
  onName: (name: string) => void;
}) {
  const [site, setSite] = useState<SiteSettings>(DEFAULT_SITE);
  useEffect(() => { const load = () => setSite(readSite()); load(); window.addEventListener("site-settings", load); return () => window.removeEventListener("site-settings", load); }, []);
  const tile = { edit: site.tileEditor, canvas: site.tileCanvas, layers: site.tileLayers, perform: site.tilePerform, workflows: site.tileWorkflows } as Record<string, string>;
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden">
      <img src={site.heroImage || scene1} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] w-full object-cover opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-16 pt-12 sm:pt-20">
        <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <img src="/pa-mark.svg" width={36} height={36} alt="" className="h-9 w-9 object-contain" /><span className="font-bold text-foreground">Perform Anywhere</span> Editor · Powered by Aurora
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
          {site.headline} <span className="text-accent">{site.accentWord}</span>
        </h1>
        <label className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{userName ? `Welcome, ${userName}` : "Welcome"}<input aria-label="Your name" value={userName} maxLength={80} onChange={(e) => onName(e.target.value)} placeholder="Your name" className="min-w-0 rounded-md border border-border bg-background/60 px-3 py-2 text-foreground" /></label>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          {site.tagline}
        </p>

        <div id="creative-start" className="mt-8 rounded-3xl border border-border glass-panel p-4 sm:p-5">
          {children}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(site.ideas.length ? site.ideas : IDEAS).map((idea) => (
            <Button key={idea} variant="outline" size="sm" onClick={() => onIdea(idea)} className="h-auto whitespace-normal rounded-full bg-card/40 px-3 py-1.5 text-left text-[11px]">
              {idea}
            </Button>
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {MODES.map(({ mode, label, copy, image, icon: Icon }) => (
            <button key={mode} type="button" onClick={() => onMode(mode)} className="group overflow-hidden rounded-2xl border border-border bg-card/50 text-left transition hover:border-primary">
              <img src={tile[mode] || image} alt="" loading="lazy" className="h-24 w-full object-cover opacity-80 transition group-hover:opacity-100" />
              <span className="flex items-center gap-1.5 px-3 pt-2.5 text-xs font-semibold"><Icon className="size-3.5 text-accent" /> {label} <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" /></span>
              <span className="block px-3 pb-3 pt-0.5 text-[11px] text-muted-foreground">{copy}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onWorkspace}><Clapperboard className="size-3.5" /> Open editor</Button>
          <Button variant="ghost" size="sm" onClick={() => onMode("workflows")}><Workflow className="size-3.5" /> Workflows</Button>
          <Button variant="ghost" size="sm" onClick={onNew}><Plus className="size-3.5" /> New session</Button>
        </div>
      </div>
    </main>
  );
}

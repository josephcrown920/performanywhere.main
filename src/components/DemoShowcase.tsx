import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import danceSrc from "@/assets/IMG_3850_1788519281635.png";
import danceDepth from "@/assets/demo/dance-depth.jpg";
import danceRender from "@/assets/demo/dance-render.jpg";
import rapSrc from "@/assets/IMG_0978_1788519281635.png";
import rapDepth from "@/assets/demo/rap-depth.jpg";
import rapRender from "@/assets/demo/rap-render.jpg";

export type Demo = {
  id: string;
  title: string;
  engine: string;
  scene: string;
  style: string;
  src: string;
  depth: string;
  render: string;
};

export const DEMOS: Demo[] = [
  {
    id: "dance", title: "Dance transfer", engine: "Seedance 2.5",
    scene: "Performer dances on a neon holographic concert stage, crowd hands raised, volumetric haze",
    style: "Music video", src: danceSrc, depth: danceDepth, render: danceRender,
  },
  {
    id: "rap", title: "Rap & lip-sync", engine: "OmniHuman",
    scene: "Intense close-up rap performance at the mic in a rainy London alley at night, neon backlight",
    style: "Cinematic 35mm", src: rapSrc, depth: rapDepth, render: rapRender,
  },
];

type Layer = "depth" | "render";

export default function DemoShowcase({ onUse }: { onUse: (d: Demo) => void }) {
  const [demo, setDemo] = useState(DEMOS[0]);
  const [layer, setLayer] = useState<Layer>("render");
  const [split, setSplit] = useState(50);
  const right = layer === "depth" ? demo.depth : demo.render;

  return (
    <section className="mb-10 rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Visual demos</p>
          <h2 className="mt-1 font-display text-2xl">See what Perform Anywhere does</h2>
        </div>
        <div className="flex gap-1.5">
          {DEMOS.map((d) => (
            <button key={d.id} onClick={() => setDemo(d)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${demo.id === d.id ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {d.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative aspect-[3/4] max-h-[520px] w-full overflow-hidden rounded-xl bg-background select-none mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={demo.id + layer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
              <img src={right} alt={`${demo.title} ${layer}`} className="absolute inset-0 h-full w-full object-cover" />
              <img src={demo.src} alt={`${demo.title} source`} className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary shadow-[0_0_12px_hsl(var(--primary))]" style={{ left: `${split}%` }} />
          <span className="absolute left-3 top-3 rounded bg-background/80 px-2 py-1 text-[10px] uppercase tracking-wider">Source</span>
          <span className="absolute right-3 top-3 rounded bg-background/80 px-2 py-1 text-[10px] uppercase tracking-wider">{layer === "depth" ? "Depth map" : "AI render"}</span>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))}
            aria-label="Compare slider" className="absolute inset-x-4 bottom-4 accent-primary" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1.5">
            {(["render", "depth"] as Layer[]).map((l) => (
              <button key={l} onClick={() => setLayer(l)}
                className={`rounded border px-2 py-1.5 text-xs transition ${layer === l ? "border-primary bg-primary/15" : "border-border text-muted-foreground"}`}>
                {l === "render" ? "AI render" : "Depth map"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[demo.src, demo.depth, demo.render].map((img, i) => (
              <img key={i} src={img} alt="" className="aspect-[3/4] w-full rounded object-cover" />
            ))}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="text-foreground font-medium">Engine:</span> {demo.engine}</p>
            <p>{demo.scene}</p>
          </div>
          <button onClick={() => onUse(demo)}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Use this demo
          </button>
        </div>
      </div>
    </section>
  );
}

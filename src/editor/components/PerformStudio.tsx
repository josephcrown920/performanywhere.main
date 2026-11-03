import { useEffect, useState } from "react";
import { Box, Download, Film, ImagePlus, Layers, Loader2, Scissors, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEPTH_GUIDE, depthMap, generateImage, generateVideo, urlToBlob } from "@/editor/lib/generate";
import { removeImageBackground } from "@/editor/lib/remove-background";
import { readSite } from "@/editor/lib/site-settings";
import { FaceSwap } from "@/editor/components/FaceSwap";
import burningHouse from "@/editor/assets/burning-house-background.jpg";
import { DEFAULT_VIDEO_ENGINE, VIDEO_ENGINES } from "@/editor/lib/engines";

type AddAsset = (url: string, kind: "image" | "video", name: string, place?: boolean) => void;
type Tab = "perform" | "motion" | "background" | "blender" | "face";
const uid = () => Math.random().toString(36).slice(2, 8);

const ROLES = ["Identity / face", "Outfit", "Location", "Pose / composition", "Car / prop"] as const;
const ANGLES = ["Wide establishing", "Low angle", "Extreme face close-up", "Over shoulder", "Dutch angle", "Side-profile super close", "Wide from behind"];
const WORKFLOWS = [
  { id: "performance", label: "Performance", hint: "Your phone clip drives a new take; face, outfit and scene stay locked." },
  { id: "grwm", label: "Get Ready With Me", hint: "Fashion transformation in one continuous set." },
  { id: "env", label: "Environment swap", hint: "Same performer, new world." },
  { id: "vehicle", label: "Luxury vehicle interior", hint: "Seated performance inside the car." },
];

function Drop({ label, url, onFile, accept = "image/*" }: { label: string; url?: string | undefined; onFile: (f: File) => void; accept?: string }) {
  return (
    <label className="group relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-border bg-card/40 text-center text-[11px] text-muted-foreground hover:border-primary">
      {url ? (accept.startsWith("video") ? <video src={url} muted loop autoPlay playsInline className="absolute inset-0 size-full object-cover" /> : <img src={url} alt={label} className="absolute inset-0 size-full object-cover" />) : <Upload className="size-4" />}
      <span className="relative z-10 mt-auto w-full bg-background/70 px-1 py-1 font-medium text-foreground">{label}</span>
       <input aria-label={label} type="file" accept={accept} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </label>
  );
}

function Status({ text }: { text: string }) {
  return text ? <p role="status" className="text-xs text-muted-foreground">{text}</p> : null;
}

function useFileUrl(file: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) { setUrl(""); return; }
    const next = URL.createObjectURL(file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

export function PerformStudio({ onAsset }: { onAsset: AddAsset }) {
  const [tab, setTab] = useState<Tab>("perform");
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Perform anywhere</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Turn references into a <span className="text-accent">shot list.</span></h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">References, camera tests and performance takes.</p>
      <nav aria-label="Perform tools" className="my-6 flex gap-1 overflow-x-auto border-b border-border pb-3">
        {([["perform", Film, "Perform Anywhere"], ["motion", Wand2, "Motion & style transfer"], ["face", ImagePlus, "Face swap"], ["background", Scissors, "Background swap"], ["blender", Box, "Blender render"]] as const).map(([id, Icon, name]) => (
          <Button key={id} size="sm" variant={tab === id ? "secondary" : "ghost"} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon />{name}</Button>
        ))}
      </nav>
      {tab === "perform" && <Perform onAsset={onAsset} />}
      {tab === "motion" && <MotionStyle onAsset={onAsset} />}
      {tab === "background" && <BackgroundSwap onAsset={onAsset} />}
      {tab === "blender" && <BlenderBridge onAsset={onAsset} />}
      {tab === "face" && <FaceSwap onAsset={onAsset} />}
    </main>
  );
}

function Perform({ onAsset }: { onAsset: AddAsset }) {
  const [wf, setWf] = useState("performance");
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [scene, setScene] = useState("A performer rapping at night, city lights drifting across the glass.");
  const [look, setLook] = useState(() => readSite().visualDirection);
  const [angles, setAngles] = useState<string[]>(ANGLES.slice(0, 5));
  const [shots, setShots] = useState<{ angle: string; url: string }[]>([]);
  const [pick, setPick] = useState<string>("");
  const [clip, setClip] = useState<File | null>(null);
  const clipUrl = useFileUrl(clip);
  const [motionCtx, setMotionCtx] = useState("Faithfully follow gestures and timing; subtle head movement and hand gestures within frame.");
  const [engine, setEngine] = useState(DEFAULT_VIDEO_ENGINE);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const anchors = ROLES.filter((r) => refs[r]);

  async function renderShots() {
    if (angles.length < 3 || angles.length > 5) return setStatus("Choose 3–5 angles.");
    setBusy(true); setShots([]);
    const flow = WORKFLOWS.find((w) => w.id === wf);
    if (!flow) { setBusy(false); return; }
    const base = `${flow.label} scene. ${scene}. Visual direction: ${look}. Keep the exact face, outfit, location and prop from the references (${anchors.join(", ") || "none supplied"}).`;
    const out: { angle: string; url: string }[] = [];
    for (const [i, angle] of angles.entries()) {
      setStatus(`Rendering angle ${i + 1}/${angles.length}: ${angle}…`);
      try {
        const referenceBlobs = await Promise.all(anchors.map((role) => urlToBlob(refs[role] ?? "")));
        const url = await generateImage(`${base} Reference image order: ${anchors.join(", ")}. Camera: ${angle}.`, "", referenceBlobs[0], false, referenceBlobs.slice(1));
        out.push({ angle, url }); setShots([...out]);
        onAsset(url, "image", `angle_${angle.replace(/\W+/g, "-").toLowerCase()}_${uid()}.png`);
      } catch (e) { setStatus(`${angle} failed: ${e instanceof Error ? e.message : "error"}`); }
    }
    setBusy(false); setStatus(`${out.length} angles ready. Pick one to bring your performance.`);
  }

  async function makeMove() {
    if (!pick || !clip) return setStatus("Select a finished still and upload your phone clip.");
    setBusy(true);
    try {
      const still = await urlToBlob(pick);
      setStatus("Building depth map…");
      const depth = await urlToBlob(await depthMap(still));
      setStatus("Transferring your performance…");
      const url = await generateVideo(`Animate this exact still with the motion of the attached performance clip. ${motionCtx}. ${DEPTH_GUIDE}`, engine, "", { image: still, video: clip, depth, onStatus: (s) => setStatus(`Video: ${s}`) });
      onAsset(url, "video", `perform_${uid()}.mp4`, true);
      setStatus("✓ Performance render added to Generations and the timeline.");
    } catch (e) { setStatus(`✗ ${e instanceof Error ? e.message : "Render failed"}`); }
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section aria-label="Choose a workflow">
          <h2 className="mb-2 text-sm font-semibold">1 · Choose a room</h2>
          <div className="grid gap-2 sm:grid-cols-4">{WORKFLOWS.map((w) => (
            <Button key={w.id} variant="ghost" onClick={() => setWf(w.id)} aria-pressed={wf === w.id} className={cn("h-auto flex-col items-start whitespace-normal rounded-lg border p-3 text-left text-xs", wf === w.id ? "border-primary bg-primary/10" : "border-border bg-card/40")}>
              <span className="font-semibold">{w.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{w.hint}</span>
            </Button>))}
          </div>
        </section>
        <section aria-label="Reference anchors">
          <h2 className="mb-2 flex items-center justify-between text-sm font-semibold">2 · Build the shot board <span className="font-mono text-[11px] text-accent">{anchors.length} / 5 uploaded</span></h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{ROLES.map((r) => <Drop key={r} label={r} url={refs[r]} onFile={(f) => setRefs((p) => ({ ...p, [r]: URL.createObjectURL(f) }))} />)}</div>
        </section>
        <section aria-label="Direct the scene" className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Scene description<textarea value={scene} onChange={(e) => setScene(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-border bg-card/40 p-2 text-xs font-normal" /></label>
          <label className="text-xs font-semibold">Visual direction<textarea value={look} onChange={(e) => setLook(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-border bg-card/40 p-2 text-xs font-normal" /></label>
        </section>
        <section aria-label="Camera angles">
          <h2 className="mb-2 text-sm font-semibold">3 · Choose 3–5 angles</h2>
          <div className="flex flex-wrap gap-2">{ANGLES.map((a) => <Button key={a} size="sm" variant={angles.includes(a) ? "default" : "outline"} onClick={() => setAngles((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a])}>{a}</Button>)}</div>
          <Button className="mt-3" disabled={busy} onClick={() => void renderShots()}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Render shot list</Button>
        </section>
        <section aria-label="Camera tests" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shots.length ? shots.map((s) => (
            <Button key={s.url} variant="ghost" onClick={() => setPick(s.url)} className={cn("h-auto flex-col gap-0 overflow-hidden rounded-lg border p-0 text-left", pick === s.url ? "border-primary ring-2 ring-primary" : "border-border")}>
              <img src={s.url} alt={s.angle} className="aspect-video w-full object-cover" /><span className="block px-2 py-1 text-[11px]">{s.angle}</span>
            </Button>)) : <p className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No camera tests yet.</p>}
        </section>
      </div>
      <aside className="space-y-3 rounded-2xl border border-border glass-panel p-4">
        <h2 className="text-sm font-semibold">4 · Make it move</h2>
        <p className="text-[11px] text-muted-foreground">Pick a finished still, then upload the phone clip whose movement you want (3–30s).</p>
        <Drop label="Phone performance video" accept="video/*" url={clipUrl} onFile={setClip} />
        <label className="block text-xs font-semibold">Motion model
          <select aria-label="Motion model" value={engine} onChange={(e) => setEngine(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs font-normal">
            {VIDEO_ENGINES.map((e) => <option key={e.id} value={e.id} disabled={!e.available}>{e.name}{!e.available ? " · Not connected" : ""}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold">Motion context<textarea value={motionCtx} onChange={(e) => setMotionCtx(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border bg-card/40 p-2 text-xs font-normal" /></label>
        <p className="flex items-center gap-1.5 text-[11px] text-accent"><Layers className="size-3" /> AI-generated depth guide</p>
        <Button className="w-full" disabled={busy || !pick || !clip} onClick={() => void makeMove()}>{busy ? <Loader2 className="animate-spin" /> : <Film />} Send to render</Button>
        <Status text={status} />
        <p className="text-[10px] text-muted-foreground">The video model interprets your clip's movement — it is not frame-exact motion capture.</p>
      </aside>
    </div>
  );
}

function MotionStyle({ onAsset }: { onAsset: AddAsset }) {
  const [engine, setEngine] = useState(DEFAULT_VIDEO_ENGINE);
  const [char, setChar] = useState<File | null>(null);
  const [drive, setDrive] = useState<File | null>(null);
  const [styleRef, setStyleRef] = useState<File | null>(null);
  const [last, setLast] = useState<File | null>(null);
  const charUrl = useFileUrl(char), driveUrl = useFileUrl(drive), styleUrl = useFileUrl(styleRef), lastUrl = useFileUrl(last);
  const [style, setStyle] = useState("Cel-shaded anime with bold ink lines");
  const [depthUrl, setDepthUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function withDepth(src: Blob) {
    setStatus("Building depth map…");
    const url = await depthMap(src); setDepthUrl(url);
    return urlToBlob(url);
  }
  async function run(kind: "motion" | "style-image" | "style-video") {
    if (!char) return setStatus("Upload a character or source image first.");
    if (kind === "motion" && !drive) return setStatus("Upload the motion video to copy.");
    setBusy(true);
    try {
      const depth = await withDepth(char);
      const styleTxt = `${style}${styleRef ? " — match the attached style reference" : ""}`;
      if (kind === "style-image") {
        setStatus("Restyling on the depth map…");
        const url = await generateImage(`Restyle the first image as: ${styleTxt}. ${DEPTH_GUIDE} ${styleRef ? "The third image is the style reference." : ""} Preserve identity, pose and layout.`, "", char, false, [depth, ...(styleRef ? [styleRef] : [])]);
        onAsset(url, "image", `style_${uid()}.png`); setStatus("✓ Style transfer ready in Generations.");
      } else {
        const prompt = kind === "motion"
          ? `Use the given video as a motion reference, not as a source for editing. Animate the first character image following its movement. Keep identity and outfit locked. ${DEPTH_GUIDE}`
          : `Style transfer video: bring this still to life in the style ${styleTxt}, gentle camera move. ${DEPTH_GUIDE}`;
        const refs = styleRef ? [styleRef] : [];
        const url = await generateVideo(prompt, engine, "", { image: char, lastFrame: last ?? undefined, video: kind === "motion" ? drive ?? undefined : undefined, depth, refs, onStatus: (s) => setStatus(`Video: ${s}`) });
        onAsset(url, "video", `${kind}_${uid()}.mp4`, true); setStatus("✓ Video added to Generations and the timeline.");
      }
    } catch (e) { setStatus(`✗ ${e instanceof Error ? e.message : "failed"}`); }
    setBusy(false);
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Drop label="First frame · character" url={charUrl} onFile={setChar} />
          <Drop label="Last frame (optional)" url={lastUrl} onFile={setLast} />
          <Drop label="Motion to copy" accept="video/*" url={driveUrl} onFile={setDrive} />
          <Drop label="Style reference" url={styleUrl} onFile={setStyleRef} />
        </div>
        <label className="block text-xs font-semibold">Style<input value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card/40 p-2 text-xs font-normal" /></label>
        <select aria-label="Motion video engine" value={engine} onChange={(e) => setEngine(e.target.value)} className="w-full rounded-md border border-border bg-background p-2 text-xs">{VIDEO_ENGINES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run("motion")}><Film /> Character motion transfer</Button>
          <Button variant="outline" disabled={busy} onClick={() => void run("style-image")}><ImagePlus /> Style transfer · image</Button>
          <Button variant="outline" disabled={busy} onClick={() => void run("style-video")}><Wand2 /> Style transfer · video</Button>
        </div>
        <Status text={status} />
        <p className="text-[11px] text-muted-foreground">Generative motion interpretation, not frame-exact capture. Use a short motion reference of up to 3 seconds.</p>
      </div>
      <aside className="rounded-2xl border border-border glass-panel p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><Layers className="size-3.5 text-accent" /> AI depth guide</p>
        {depthUrl ? <img src={depthUrl} alt="Depth map" className="w-full rounded-lg" /> : <p className="text-[11px] text-muted-foreground">Every job builds a depth map first and sends it with the render. It shows here.</p>}
      </aside>
    </div>
  );
}

function BackgroundSwap({ onAsset }: { onAsset: AddAsset }) {
  const [subject, setSubject] = useState("");
  const [cutout, setCutout] = useState("");
  const [bg, setBg] = useState(burningHouse);
  const [bgPrompt, setBgPrompt] = useState("Rooftop in Lagos at golden hour, cinematic");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function cut() {
    if (!subject) return;
    setBusy(true);
    try { setCutout(await removeImageBackground(subject, setStatus)); setStatus("✓ Background removed."); } catch (e) { setStatus(`✗ ${e instanceof Error ? e.message : "failed"}`); }
    setBusy(false);
  }
  async function genBg() {
    setBusy(true); setStatus("Generating background…");
    try { setBg(await generateImage(bgPrompt, "")); setStatus("Background ready."); } catch (e) { setStatus(`✗ ${e instanceof Error ? e.message : "failed"}`); }
    setBusy(false);
  }
  async function composite() {
    if (!cutout || !bg) return setStatus("Need a cutout and a background.");
    const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
    setBusy(true);
    try {
    const [b, c] = await Promise.all([load(bg), load(cutout)]);
    const cv = document.createElement("canvas"); cv.width = b.width; cv.height = b.height;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("Could not open the image canvas.");
    ctx.drawImage(b, 0, 0);
    const h = b.height * 0.85, w = (c.width / c.height) * h;
    ctx.drawImage(c, b.width - w - b.width * 0.04, b.height - h, w, h);
    const url = cv.toDataURL("image/png");
    onAsset(url, "image", `bgswap_${uid()}.png`); setStatus("✓ Composite added to Generations.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Composite failed."); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Drop label="Subject photo" url={subject} onFile={(f) => { setSubject(URL.createObjectURL(f)); setCutout(""); }} />
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0_25%,transparent_0_50%)] bg-[length:16px_16px]">{cutout ? <img src={cutout} alt="Cutout" className="size-full object-contain" /> : <span className="text-[11px] text-muted-foreground">Cutout</span>}</div>
        <Drop label="New background" url={bg} onFile={(f) => setBg(URL.createObjectURL(f))} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={busy || !subject} onClick={() => void cut()}><Scissors /> Remove background</Button>
        <input value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} aria-label="Background prompt" className="min-w-48 flex-1 rounded-lg border border-border bg-card/40 p-2 text-xs" />
        <Button variant="outline" disabled={busy} onClick={() => void genBg()}><Sparkles /> Generate background</Button>
        <Button variant="secondary" disabled={busy || !cutout || !bg} onClick={() => void composite()}><Layers /> Replace background</Button>
      </div>
      <Status text={status} />
    </div>
  );
}

function BlenderBridge({ onAsset }: { onAsset: AddAsset }) {
  const [move, setMove] = useState<"orbit" | "dolly" | "crane">("orbit");
  const [secs, setSecs] = useState(6);
  const [res, setRes] = useState("1920x1080");
  function script() {
    const [w, h] = res.split("x");
    const frames = secs * 24;
    const path = { orbit: "cam_angle = (f / FRAMES) * math.tau\n    cam.location = (8*math.cos(cam_angle), 8*math.sin(cam_angle), 2.5)", dolly: "cam.location = (0, -12 + 8*(f/FRAMES), 1.7)", crane: "cam.location = (0, -9, 0.8 + 5*(f/FRAMES))" }[move];
    return `# Reel → Blender render bridge. Run in Blender: Scripting > Open > Run Script.
import bpy, math
FRAMES = ${frames}
scn = bpy.context.scene
scn.render.engine = 'CYCLES'
scn.render.resolution_x, scn.render.resolution_y = ${w}, ${h}
scn.frame_start, scn.frame_end = 1, FRAMES
scn.render.fps = 24
scn.view_layers[0].use_pass_z = True          # depth pass
scn.view_layers[0].use_pass_mist = True
scn.view_layers[0].use_pass_normal = True
if "Target" not in bpy.data.objects:
    bpy.ops.object.empty_add(location=(0, 0, 1.2)); bpy.context.object.name = "Target"
target = bpy.data.objects["Target"]
cam = scn.camera or bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
if cam.name not in scn.collection.objects: scn.collection.objects.link(cam)
scn.camera = cam
c = cam.constraints.get("Track") or cam.constraints.new('TRACK_TO'); c.name = "Track"; c.target = target
for f in range(1, FRAMES + 1):
    scn.frame_set(f)
    ${path}
    cam.keyframe_insert("location", frame=f)
c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format = 'MPEG4'
scn.render.filepath = "//reel_render.mp4"
print("Ready: Render > Render Animation. Import reel_render.mp4 back into Reel.")
`;
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([script()], { type: "text/x-python" }));
    a.download = `reel_${move}_camera.py`; a.click();
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Blender runs on your own computer. Pick a camera move, download the script, run it in Blender (it sets up Cycles with depth, mist and normal passes), then import the rendered video here.</p>
      <div className="flex flex-wrap items-center gap-2">
        {(["orbit", "dolly", "crane"] as const).map((m) => <Button key={m} size="sm" variant={move === m ? "default" : "outline"} onClick={() => setMove(m)}>{m}</Button>)}
        <label className="text-xs">Seconds <input type="number" min={2} max={30} value={secs} onChange={(e) => setSecs(Number(e.target.value) || 6)} className="ml-1 w-16 rounded border border-border bg-card/40 p-1" /></label>
        <select aria-label="Resolution" value={res} onChange={(e) => setRes(e.target.value)} className="rounded border border-border bg-card/40 p-1 text-xs"><option>1920x1080</option><option>1080x1920</option><option>3840x2160</option></select>
      </div>
      <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-card/40 p-3 text-[10px]">{script()}</pre>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}><Download /> Download Blender script</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"><Upload className="size-3.5" /> Import Blender render
          <input type="file" accept="video/*,image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onAsset(URL.createObjectURL(f), f.type.startsWith("video") ? "video" : "image", f.name, true); }} />
        </label>
      </div>
    </div>
  );
}

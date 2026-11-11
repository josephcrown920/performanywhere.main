import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

type Slot = "identity" | "outfit" | "location" | "pose" | "prop" | "performance" | "target";
const slots: { key: Slot; title: string; hint: string; accept: string }[] = [
  { key: "identity", title: "Avatar identity", hint: "Character photo or sheet", accept: "image/*" },
  { key: "outfit", title: "Outfit", hint: "Clothing reference", accept: "image/*" },
  { key: "location", title: "Location", hint: "Background reference", accept: "image/*" },
  { key: "pose", title: "Pose", hint: "Composition reference", accept: "image/*" },
  { key: "prop", title: "Car / prop", hint: "Optional reference", accept: "image/*" },
  { key: "performance", title: "Performance video", hint: "Source movement and timing", accept: "video/*" },
  { key: "target", title: "Approved target photo", hint: "Prepared scene image", accept: "image/*" },
];
const presets = ["Build a Scene", "Colors Studio", "Luxury Interior", "Motion Control"] as const;
const videoModels = ["Genjutsu", "Seedance 2.5", "Seedance 2.0 Mini", "Kling", "MiniMax", "OmniHuman", "Wan"];
const imageModels = ["Sunburst", "Seedream", "FLUX", "Wan", "GPT Image"];
export const Route = createFileRoute("/aurora-perform")({
  ssr: false,
  component: AuroraPerform,
  head: () => ({ meta: [{ title: "Aurora Perform Anywhere — Scene & Motion Studio" }] }),
});
function AuroraPerform() {
  const [tab, setTab] = useState<(typeof presets)[number]>("Build a Scene");
  const [assets, setAssets] = useState<Partial<Record<Slot, { file: File; url: string }>>>({});
  const [prompt, setPrompt] = useState("Preserve the source performance, timing and camera movement. Use my approved target image, identity and outfit.");
  const [model, setModel] = useState("Genjutsu");
  const [notice, setNotice] = useState("");
  const urls = useRef(new Set<string>());
  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); urls.current.clear(); }, []);
  const exportShot = () => {
    const manifest = {
      schemaVersion: 1, workflow: "aurora-perform-anywhere", modelPreference: model,
      prompt, sceneMode: tab, assets: Object.fromEntries(Object.entries(assets).map(([slot, asset]) => [slot, asset ? { name: asset.file.name, type: asset.file.type, bytes: asset.file.size } : null])),
      note: "Metadata only. Local media files are not included. Provider execution is not configured.",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "aurora-shot-manifest.json"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Shot manifest exported. Media files remain on your device.");
  };
  const add = (slot: Slot, file?: File) => {
    if (!file) return;
    const acceptsVideo = slot === "performance";
    if ((acceptsVideo && !file.type.startsWith("video/")) || (!acceptsVideo && !file.type.startsWith("image/"))) {
      setNotice("Please select the correct media type for this reference."); return;
    }
    if (file.size > 100 * 1024 * 1024) { setNotice("Files must be under 100 MB."); return; }
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    setAssets((old) => {
      const previous = old[slot]?.url;
      if (previous) { URL.revokeObjectURL(previous); urls.current.delete(previous); }
      return { ...old, [slot]: { file, url } };
    });
    setNotice(`${file.name} added locally. It has not been uploaded or submitted to a provider.`);
  };
  const card = (slot: Slot) => {
    const config = slots.find((s) => s.key === slot)!;
    const asset = assets[slot];
    return <label key={slot} className="block cursor-pointer rounded-xl border border-white/20 bg-white/5 p-3 hover:border-purple-400">
      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-black/40">
        {asset ? (slot === "performance" ? <video src={asset.url} controls className="h-full w-full object-contain" /> : <img src={asset.url} alt={config.title} className="h-full w-full object-cover" />) : <span className="text-3xl text-purple-300">+</span>}
      </div>
      <strong className="block text-sm">{config.title}</strong><span className="text-xs text-white/60">{asset?.file.name ?? config.hint}</span>
      <input className="sr-only" type="file" accept={config.accept} onChange={(e) => add(slot, e.target.files?.[0])} />
    </label>;
  };
  const ready = !!assets.performance && !!assets.target;
  return <main className="min-h-screen bg-[#09070f] px-4 py-8 text-white">
    <div className="mx-auto max-w-5xl">
      <div className="text-xs font-bold uppercase tracking-[.25em] text-purple-300">Aurora Performance Studio</div>
      <h1 className="my-4 text-5xl font-black tracking-tight">Perform Anywhere</h1>
      <p className="mb-6 text-white/65">Prepare your scene, approve the target image, and use a performance video to drive the shot.</p>
      <nav aria-label="Studio sections" className="mb-6 flex flex-wrap gap-2">{presets.map((name) => <button type="button" key={name} onClick={() => setTab(name)} className={`rounded-xl border px-4 py-2 text-sm ${tab === name ? "border-purple-400 bg-purple-800/40" : "border-white/20 bg-white/5"}`}>{name}</button>)}</nav>
      {tab === "Build a Scene" && <section><h2 className="mb-3 text-2xl font-bold">Reference inputs</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{(["identity", "outfit", "location", "pose", "prop"] as Slot[]).map(card)}</div><div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5"><h2 className="mb-3 text-xl font-bold">Approved scene</h2>{card("target")}</div></section>}
      {tab === "Colors Studio" && <section className="rounded-2xl border border-white/20 bg-white/5 p-5"><h2 className="text-2xl font-bold">Colors Studio</h2><p className="my-3 text-white/65">Use lighting and color-stage references as your location image. Then approve a generated scene before motion transfer.</p>{card("location")}{card("target")}</section>}
      {tab === "Luxury Interior" && <section className="rounded-2xl border border-white/20 bg-white/5 p-5"><h2 className="text-2xl font-bold">Luxury Interior</h2><p className="my-3 text-white/65">Choose an interior scene and a character image to prepare your final target.</p><div className="grid grid-cols-2 gap-3">{card("location")}{card("target")}</div></section>}
      {tab === "Motion Control" && <section className="rounded-2xl border border-white/20 bg-white/5 p-5"><h2 className="text-2xl font-bold">Performance-driven motion transfer</h2><p className="my-3 text-white/65">Select a driving video and approved scene photo. Provider execution is disabled until a verified server integration and credit confirmation are available.</p><div className="grid gap-3 md:grid-cols-2">{card("performance")}{card("target")}</div><label className="mt-5 block text-sm">Direction prompt<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white" /></label><label className="mt-4 block text-sm">Preferred video model<select value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-[#181020] p-3">{videoModels.map((name) => <option key={name}>{name}</option>)}</select></label><button type="button" onClick={() => setNotice(ready ? `Scene ready for ${model}. Provider submission is not enabled; no credits have been spent.` : "Add both a performance video and an approved target photo first.")} className="mt-4 rounded-xl bg-purple-700 px-5 py-3 font-bold">Validate shot</button><p className="mt-3 text-xs text-white/60">Image model candidates: {imageModels.join(" · ")}</p></section>}
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={exportShot} className="rounded-xl border border-purple-400 px-4 py-2 text-sm font-semibold">Export shot manifest (JSON)</button><span className="text-xs text-white/60">No media upload or paid generation occurs.</span></div>
      {notice && <p role="status" className="mt-5 rounded-xl border border-purple-500/50 bg-purple-900/20 p-3 text-sm">{notice}</p>}
      <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link to="/studio" className="rounded-lg border border-white/30 px-4 py-2">Existing workflow studio</Link><Link to="/editor" className="rounded-lg border border-white/30 px-4 py-2">Open timeline editor</Link><Link to="/agent/timeline" className="rounded-lg border border-white/30 px-4 py-2">Timeline agent</Link></div>
    </div>
  </main>;
}

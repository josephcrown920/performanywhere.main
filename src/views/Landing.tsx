import { Link } from "@/lib/nav";
import { ArrowRight, Bot, Check, Code2, Film, Layers3, Sparkles, Upload, Wand2, Zap } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import performer from "@/assets/IMG_0978_1788519281635.png";
import finalScene from "@/assets/IMG_3849_1788519281635.png";
import location from "@/assets/IMG_9787_1788519281635.jpeg";

const MODELS = [
  { name: "OmniHuman 2.0", use: "Audio-driven performance", tier: "Budget", color: "text-emerald-300 bg-emerald-300/10" },
  { name: "Seedance 2.0 Mini / Wan", use: "Scene drafts and previews", tier: "Budget", color: "text-emerald-300 bg-emerald-300/10" },
  { name: "Kling 2.6 Motion", use: "Phone-video motion transfer", tier: "Standard", color: "text-violet-200 bg-violet-300/10" },
  { name: "Genjutsu", use: "Premium full performance transfer", tier: "Premium", color: "text-amber-200 bg-amber-300/10" },
] as const;

const FEATURES = [
  ["Scene Builder", "Combine identity, outfit, location, pose and props into one continuity-locked scene.", Layers3],
  ["Get Ready With Me", "Preserve your real getting-ready performance while changing wardrobe and environment.", Wand2],
  ["Aurora Agent", "Plan the shot, select a compatible route and keep every production decision together.", Bot],
  ["Codex Editor", "Finish the generated shots on the layered timeline without leaving Perform Anywhere.", Code2],
] as const;

export default function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#08070d] text-white selection:bg-fuchsia-400/30">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#08070d]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3"><BrandMark size={34} /><span className="hidden text-sm font-bold sm:inline">Perform Anywhere</span></Link>
          <nav className="flex items-center gap-2">
            <Link href="/agent" className="hidden items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/65 hover:text-white sm:inline-flex"><Bot className="h-3.5 w-3.5" />Agent</Link>
            <Link href="/editor" className="hidden items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/65 hover:text-white md:inline-flex"><Code2 className="h-3.5 w-3.5" />Codex Editor</Link>
            <Link href="/studio" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-xs font-bold"><Upload className="h-3.5 w-3.5" />Start</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-32 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(192,72,255,.2),transparent_38%)]" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-200"><Zap className="h-3 w-3" />Budget routing on by default</div>
            <p className="text-[11px] font-bold uppercase tracking-[.28em] text-fuchsia-300">Perform Anywhere by Aurora</p>
            <h1 className="mt-5 text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-7xl">Your performance in.<br /><span className="bg-gradient-to-r from-fuchsia-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">A finished world out.</span></h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">Build the scene from references, upload your phone performance, and let Aurora choose the cheapest compatible motion route before you generate.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/studio" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black"><Sparkles className="h-4 w-4" />Build a scene</Link>
              <Link href="/studio?workflow=get-ready-with-me" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/75">Get Ready With Me</Link>
            </div>
            <p className="mt-3 text-xs text-white/35">Exact credit quote before generation · no silent premium fallback</p>
          </div>

          <div className="relative mx-auto mt-14 grid max-w-6xl gap-3 rounded-3xl border border-white/10 bg-white/[.025] p-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <SceneCard image={performer} kicker="Identity" title="Your performer" />
            <StepArrow />
            <SceneCard image={location} kicker="Scene Builder" title="Outfit · location · prop" />
            <StepArrow />
            <SceneCard image={finalScene} kicker="Final render" title="Motion-controlled result" active />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-8 max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[.25em] text-fuchsia-300">One connected production flow</p><h2 className="mt-3 text-4xl font-black tracking-tight">Scene → performance → editor</h2></div>
          <div className="grid gap-4 md:grid-cols-2">{FEATURES.map(([title, body, Icon]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-400/10 text-fuchsia-300"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
            </article>
          ))}</div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-8 text-center"><p className="text-[11px] font-bold uppercase tracking-[.25em] text-emerald-300">Cost-aware models</p><h2 className="mt-3 text-4xl font-black tracking-tight">Pay for the capability you need</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">Drafts and talking performances stay on budget routes. Genjutsu is reserved for shots that require premium full-body transfer.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{MODELS.map((model) => (
            <article key={model.name} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{model.name}</h3><p className="mt-1 text-sm text-white/45">{model.use}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${model.color}`}>{model.tier}</span></div>
            </article>
          ))}</div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-20">
          <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-400/10 to-violet-600/10 p-8 sm:p-10">
            <div className="grid gap-3 sm:grid-cols-2">{["Identity and outfit references","Phone performance upload","GRWM workflow","Scene and camera planning","Aurora Agent access","Layered Codex Editor"].map((item) => <div key={item} className="flex items-center gap-2.5 text-sm text-white/75"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400/15 text-fuchsia-300"><Check className="h-3 w-3" /></span>{item}</div>)}</div>
            <Link href="/studio" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black">Open Perform Anywhere <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-5 text-xs text-white/40"><span className="flex items-center gap-2"><Film className="h-3.5 w-3.5 text-fuchsia-300" />Aurora Perform Anywhere</span><div className="flex gap-4"><Link href="/agent">Agent</Link><Link href="/editor">Editor</Link><Link href="/account">Pricing</Link></div></footer>
    </div>
  );
}

function SceneCard({ image, kicker, title, active = false }: { image: string; kicker: string; title: string; active?: boolean }) {
  return <article className={`overflow-hidden rounded-2xl border bg-black/40 ${active ? "border-fuchsia-400/60 shadow-[0_0_45px_rgba(192,72,255,.16)]" : "border-white/10"}`}><img src={image} alt="" className="aspect-video w-full object-cover" /><div className="p-4 text-left"><p className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-300">{kicker}</p><h3 className="mt-1 text-sm font-bold">{title}</h3></div></article>;
}

function StepArrow() {
  return <div className="flex items-center justify-center text-fuchsia-300"><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /></div>;
}

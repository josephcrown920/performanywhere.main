import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@/lib/nav";
import { ArrowRight, ArrowDown, ArrowUpRight, Sparkles, Upload, Music2, Smartphone, Check, Mail } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { CREDIT_PACK, PLANS, detectRegion, type Region } from "@/lib/pricing";
import demoVideo from "@/assets/pa/perform-anywhere-demo.mp4.asset.json";
import motionVideo from "@/assets/pa/motion-reference-demo.mp4.asset.json";
import artistVideo from "@/assets/pa/artist-performance-demo.mp4.asset.json";
import colorsGrid from "@/assets/pa/colors-grid.webp.asset.json";
import car from "@/assets/pa/car.webp.asset.json";
import result from "@/assets/pa/result.webp.asset.json";

const BADGES = [
  [Sparkles, "By artists, for artists"],
  [Upload, "Your references, your direction"],
  [Music2, "Your song in the final cut"],
  [Smartphone, "Phone-first performance workflow"],
] as const;

const VIDEOS = [
  [demoVideo.url, "Perform Anywhere · performance transformation"],
  [motionVideo.url, "At the mic · motion transfer"],
  [artistVideo.url, "Perform Anywhere · artist performance"],
] as const;

const STEPS = [
  ["01 / Scene Builder", "Build your scene", "Bring your identity, outfit, location and props together in an approved target image.", "Prepare my scene", "scene"],
  ["02 / Perform Anywhere", "Move into your world", "Pair a driving performance video with your scene. Match the pose and camera angle for a stronger motion match.", "Explore motion", "motion"],
  ["03 / Lip sync", "Finish with your song", "Using a reference performance with different audio? Add your own song after the motion render, then create the lip-synced final cut.", "See the finishing step", "motion"],
] as const;

const STUDIOS = [
  ["Colors Studio", "Find your signature set", "Explore bold color environments, lighting references and microphone stages for your next release.", colorsGrid.url, "colors"],
  ["Luxury Interior", "Your seated performance, elevated", "Plan the car interior, outfit and identity, then use a seated phone performance that matches the composition.", car.url, "interior"],
  ["Artist Visuals", "Build a consistent campaign", "Direct scene stills, press-photo concepts and promotional looks around your artist identity.", result.url, "scene"],
] as const;

const WHY = [
  ["References before renders", "Choose the person, styling and world first. Approve the scene before moving into motion."],
  ["A workflow that makes sense", "Scene → motion → optional lip sync. Each step has a clear purpose, so your song comes in at the right point."],
  ["Made for your release", "Move between studio colors, custom locations and luxury interiors without changing your creative direction."],
] as const;

const STORIES = [
  ["A full music video without leaving my room.", "I thought bringing my video idea to life meant travelling, booking locations and organising a big shoot. With Perform Anywhere, I could record in my room and build different scenes around my performance. The idea finally felt within reach."],
  ["More creating. Less organising.", "As a content creator, setting up locations and planning shoots takes time away from actually creating. Perform Anywhere helps me turn one recording session into different visual ideas, so I can spend more time making content and connecting with my audience."],
  ["My EP budget finally stretched beyond one video.", "I'm an independent artist, so every expense matters. Instead of putting my whole visual budget into one location shoot, I could create something for every track on my EP. Each song could have its own mood while the project still felt connected."],
  ["I don't have to wait for the perfect shoot day.", "Getting everyone available at the same time used to slow everything down. Being able to record at home and create the setting around my performance makes it easier to keep moving when inspiration hits."],
  ["It helped me focus on the music — and it showed.", "I used to get caught up worrying about locations, setups and how everything would look. I could stay in my room, practice my delivery and put my energy into the song. Having space to try another take helped me give a performance I was proud of."],
  ["I stopped rushing my performance to fit the shoot.", "When you're watching the clock at a location, it's hard to relax and feel the music. Recording in my own space gave me room to experiment with my movement, expressions and delivery."],
  ["Less time setting up. More time creating.", "As a creator, coming up with ideas is the part I love. Organising a new shoot for every idea can wear me out. With Perform Anywhere, I could focus on what I wanted to say and explore different settings around my recording."],
] as const;

const INTERESTS = ["Perform Anywhere", "Colors Studio", "Luxury Interior", "Lip sync", "Artist visuals and press photos"];

export default function Landing() {
  const [region, setRegion] = useState<Region>("international");
  useEffect(() => setRegion(detectRegion()), []);

  return (
    <div className="pa-shell min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="shrink-0"><BrandMark size={34} /></Link>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <a href="#services" className="hidden px-3 py-2 text-muted-foreground hover:text-foreground md:inline">Services</a>
            <a href="#why" className="hidden px-3 py-2 text-muted-foreground hover:text-foreground md:inline">Why Perform Anywhere</a>
            <a href="#stories" className="hidden px-3 py-2 text-muted-foreground hover:text-foreground md:inline">Stories</a>
            <a href="#pricing" className="hidden px-3 py-2 text-muted-foreground hover:text-foreground lg:inline">Pricing</a>
            <Link href="/studio" className="btn-cta ml-2 !px-4 !py-2.5 !text-xs">Open studio <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-28 lg:grid-cols-[1.1fr_.9fr] lg:pt-36">
          <div>
            <p className="eyebrow">Your sound. Your world.</p>
            <h1 className="font-condensed mt-5 text-[clamp(3.4rem,11vw,7.5rem)] font-black uppercase leading-[0.86] tracking-[-0.035em]">
              By artists.<br /><span className="text-highlight">For artists.</span>
            </h1>
            <p className="mt-7 text-2xl font-bold leading-tight sm:text-3xl">Your phone performance.<br />Your next music-video world.</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">Direct your visual identity with Perform Anywhere. Build your scene, choose your outfit and turn a performance into a new visual world. Finish with your own song through optional lip sync.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn-cta">Start your shoot <ArrowRight className="h-4 w-4" /></Link>
              <a href="#services" className="btn-soft">See it in action <ArrowDown className="h-4 w-4" /></a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Explore the studio free · you only pay when you generate</p>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-cta-from/20 blur-3xl" />
            <figure className="relative overflow-hidden rounded-[2rem] border border-line-strong bg-card p-2 shadow-2xl">
              <video src={demoVideo.url} autoPlay muted loop playsInline className="aspect-[3/4] w-full rounded-[1.5rem] object-cover" />
              <figcaption className="flex items-center justify-between px-3 py-3 text-xs">
                <span className="font-bold">Phone take → new world</span>
                <span className="rounded-full bg-primary/15 px-2 py-1 font-bold text-primary">Motion</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5">
            <span className="eyebrow !text-muted-foreground">Built around the artist</span>
            {BADGES.map(([Icon, label]) => <span key={label} className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{label}</span>)}
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20">
          <p className="eyebrow">Our services</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">One creative direction.<br /><span className="text-highlight">A whole world of visuals.</span></h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {VIDEOS.map(([src, caption]) => (
              <figure key={caption} className="overflow-hidden rounded-3xl border border-border bg-card">
                <video src={src} autoPlay muted loop playsInline className="aspect-[3/4] w-full object-cover" />
                <figcaption className="px-4 py-3 text-xs font-semibold text-muted-foreground">{caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map(([kicker, title, body, cta, tab]) => (
              <article key={kicker} className="flex flex-col rounded-3xl border border-border bg-card p-6">
                <p className="eyebrow">{kicker}</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <Link href={`/studio?tab=${tab}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary">{cta} <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {STUDIOS.map(([kicker, title, body, img, tab]) => (
              <Link key={kicker} href={`/studio?tab=${tab}`} className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:border-line-strong">
                <img src={img} alt={title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="p-6">
                  <p className="eyebrow">{kicker}</p>
                  <h3 className="mt-2 text-xl font-black tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="why" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20">
          <p className="eyebrow">Why Perform Anywhere</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">You bring the performance.<br /><span className="text-highlight">You keep the creative control.</span></h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {WHY.map(([title, body], i) => (
              <article key={title} className="rounded-3xl border border-border bg-card p-6">
                <span className="font-condensed text-5xl font-black text-primary/40">0{i + 1}</span>
                <h3 className="mt-3 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="stories" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-5">
            <p className="eyebrow">Illustrative artist stories</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-5xl">More room for your music.<br /><span className="text-highlight">More possibilities for your visuals.</span></h2>
            <p className="mt-4 max-w-2xl text-xs text-muted-foreground">Scenarios illustrating the intended workflow — not verified customer testimonials or promises of results.</p>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] lg:mx-auto lg:max-w-7xl">
            {STORIES.map(([title, quote]) => (
              <article key={title} className="w-[82vw] max-w-sm shrink-0 snap-start rounded-3xl border border-border bg-card p-6">
                <h3 className="text-lg font-black leading-snug tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">“{quote}”</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-6 flex max-w-7xl flex-wrap gap-3 px-5">
            <Link href="/studio" className="btn-cta">Explore your next performance <ArrowRight className="h-4 w-4" /></Link>
            <a href="#pricing" className="btn-soft">See pricing <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] sm:text-5xl">One pack. <span className="text-highlight">Priced for where you are.</span></h2>
          <div className="mt-10 grid gap-4 md:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-3xl border border-line-strong bg-card p-7">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PLANS) as Region[]).map((r) => (
                  <button key={r} type="button" onClick={() => setRegion(r)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${region === r ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>{PLANS[r].label}</button>
                ))}
              </div>
              <div className="mt-6 flex items-end gap-3">
                <span className="font-condensed text-7xl font-black leading-none">${PLANS[region].usd}</span>
                <span className="pb-2 text-sm text-muted-foreground">{PLANS[region].display} · one-time</span>
              </div>
              <p className="mt-3 text-lg font-bold">{CREDIT_PACK.toLocaleString()} credits</p>
              <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                {["Scene builds from your references", "Motion renders from your scene", "Your renders saved to your library", "No automatic renewal"].map((x) => <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{x}</li>)}
              </ul>
              <Link href="/account" className="btn-cta mt-7">Get credits <ArrowRight className="h-4 w-4" /></Link>
            </article>
            <article className="rounded-3xl border border-border bg-card p-7">
              <h3 className="text-xl font-black tracking-tight">You see the cost first</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Every motion render shows its exact credit charge before you press generate. If a render fails, the credits go straight back to your wallet.</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Card payments are handled securely through Paystack.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-line-strong bg-card p-8 sm:p-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cta-to/25 blur-3xl" />
            <p className="eyebrow relative">Your next release deserves its own world</p>
            <h2 className="relative mt-4 text-4xl font-black leading-[1.02] tracking-[-0.03em] sm:text-6xl">Bring your song.<br /><span className="text-highlight">Direct your next visual.</span></h2>
            <p className="relative mt-5 max-w-xl text-muted-foreground">Start with a scene, bring the performance and finish with your actual song. Explore the workspace or tell the team about your project.</p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn-cta">Open my studio <ArrowRight className="h-4 w-4" /></Link>
              <a href="#contact" className="btn-soft">Talk about my project <ArrowDown className="h-4 w-4" /></a>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground">
          <BrandMark size={28} />
          <div className="flex flex-wrap gap-5">
            <a href="mailto:support@auroraperformancestudio.com" className="hover:text-foreground">Contact the team</a>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
          <span>© 2026 Perform Anywhere · By artists. For artists.</span>
        </div>
      </footer>
    </div>
  );
}

function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [brief, setBrief] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const subject = `Perform Anywhere project — ${interest}`;
    const body = `Name: ${name}\nEmail: ${email}\nInterested in: ${interest}\n\n${brief}`;
    window.location.href = `mailto:support@auroraperformancestudio.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <section id="contact" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-24">
      <p className="eyebrow">Let's plan your next visual</p>
      <h2 className="mt-3 text-4xl font-black tracking-[-0.03em]">Tell us what you're creating.</h2>
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-bold">Artist / business name<input required value={name} onChange={(e) => setName(e.target.value)} className={field} /></label>
        <label className="grid gap-1.5 text-xs font-bold">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></label>
        <label className="grid gap-1.5 text-xs font-bold sm:col-span-2">I'm interested in
          <select value={interest} onChange={(e) => setInterest(e.target.value)} className={field}>{INTERESTS.map((i) => <option key={i}>{i}</option>)}</select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold sm:col-span-2">Your project<textarea required rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} className={`${field} resize-none`} placeholder="Song, release date, the world you imagine…" /></label>
        <div className="sm:col-span-2">
          <button className="btn-cta"><Mail className="h-4 w-4" />Email my project brief</button>
          <p className="mt-3 text-xs text-muted-foreground">Opens your email app to support@auroraperformancestudio.com. Nothing is sent until you press Send there.</p>
        </div>
      </form>
    </section>
  );
}

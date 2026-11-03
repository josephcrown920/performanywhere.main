import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Clock, Plus, Sparkles, TriangleAlert, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/flow/components/app-shell";
import { STYLE_PRESETS } from "@/flow/data/demo";
import { generateShotList } from "@/flow/lib/director.functions";
import { flowStore } from "@/flow/lib/store";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/flow/director")({
  head: () => ({
    meta: [
      { title: "AI Director — Flowaurora" },
      {
        name: "description",
        content: "Give the AI Director a logline and get a full cinematic shot list with camera notes.",
      },
      { property: "og:title", content: "AI Director — Flowaurora" },
      { property: "og:description", content: "A logline in, a full shot list out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DirectorPage,
});

type DirectorResult = Awaited<ReturnType<typeof generateShotList>>;

const EXAMPLES = [
  "A deep-space salvage crew answers a distress call from their own ship, ten years in the future.",
  "A retired courier discovers the last letter she never delivered is rewriting her city.",
  "Two rival chefs are locked overnight in a restaurant that cooks with memories.",
];

function ResultCard({ shot, index }: { shot: DirectorResult["shots"][number]; index: number }) {
  return (
    <div className="glass holo-edge flex gap-4 rounded-xl p-4">
      <span className="font-display text-3xl leading-none text-foreground/25">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-head text-sm font-bold uppercase tracking-wide">{shot.title}</h3>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-head text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {shot.scene} · {shot.number}
          </span>
          <span className="flex items-center gap-1 font-head text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" /> {shot.duration}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shot.description}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="h-3.5 w-3.5 shrink-0 text-holo-cyan" />
          <span className="truncate">{shot.camera}</span>
        </div>
      </div>
    </div>
  );
}

function DirectorPage() {
  const [logline, setLogline] = useState("");
  const [style, setStyle] = useState<string>(STYLE_PRESETS[0]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<DirectorResult | null>(null);

  const run = async () => {
    if (logline.trim().length < 8) {
      toast.error("Give the director a little more story");
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const generated = await generateShotList({ data: { logline: logline.trim(), style } });
      setResult(generated);
      toast.success(
        generated.source === "ai" ? `Blocked ${generated.shots.length} shots` : "Blocked shots from the offline template",
      );
    } catch (error) {
      console.error(error);
      toast.error("The director hit a snag — try again in a moment");
    } finally {
      setPending(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* Input panel */}
          <section className="glass holo-edge h-fit rounded-2xl p-6 lg:sticky lg:top-24">
            <p className="font-head text-xs font-semibold uppercase tracking-[0.25em] text-holo-violet">
              AI Director
            </p>
            <h1 className="mt-2 font-display text-3xl uppercase tracking-tight">Block the scene</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pitch a logline or script concept. The director returns scene breakdowns, camera notes
              and pacing.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="logline" className="font-head text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Logline / concept
                </label>
                <Textarea
                  id="logline"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  placeholder="In a city where memories are streamed as holograms, a burnt-out detective hunts the ghost of a woman who never existed…"
                  rows={5}
                  className="resize-none bg-secondary/50"
                />
              </div>
              <div className="grid gap-2">
                <span className="font-head text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Style preset
                </span>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-secondary/50 font-head text-sm font-semibold uppercase tracking-wide">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    {STYLE_PRESETS.map((preset) => (
                      <SelectItem key={preset} value={preset} className="font-head text-sm uppercase tracking-wide">
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={run}
                disabled={pending}
                className="holo-edge h-12 gap-2 bg-primary font-head text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
              >
                {pending ? (
                  "Blocking shots…"
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Direct my scene
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6">
              <p className="font-head text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Try an example
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => setLogline(example)}
                    className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-holo-violet/50 hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="min-w-0">
            {pending && (
              <div className="grid gap-4">
                <div className="shimmer glass h-24 rounded-xl" />
                <div className="shimmer glass h-24 rounded-xl" />
                <div className="shimmer glass h-24 rounded-xl" />
                <p className="text-center font-head text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Blocking shots · breaking scenes · pacing the cut
                </p>
              </div>
            )}

            {!pending && !result && (
              <div className="glass rounded-2xl px-8 py-24 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-holo-violet" />
                <p className="mt-4 font-display text-2xl uppercase text-foreground/85">The board awaits</p>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                  Pitch your concept on the left. The shot list lands here, ready to send to the
                  storyboard.
                </p>
                <Link
                  to="/flow/storyboard"
                  className="mt-6 inline-flex items-center gap-1.5 font-head text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  See the current board <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {!pending && result && (
              <div className="grid gap-4">
                {result.source === "offline" && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-holo-amber/40 bg-holo-amber/10 px-4 py-3 text-sm text-foreground/90">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-holo-amber" />
                    <span>
                      The AI gateway wasn't reachable, so an offline directing template filled in.
                      The structure is real — regenerate later for tailored shots.
                    </span>
                  </div>
                )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-head text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Shot list · {result.shots.length} shots
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          flowStore.addShots(result.shots);
                          toast.success(`${result.shots.length} shots added to the storyboard`);
                        }}
                        className="holo-edge inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-head text-xs font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.03]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to storyboard
                      </button>
                      <Link
                        to="/flow/storyboard"
                        className="glass inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-head text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View board <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                {result.shots.map((shot, index) => (
                  <ResultCard key={shot.id} shot={shot} index={index} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

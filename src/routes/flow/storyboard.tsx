import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Clock, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWebMCP } from "use-webmcp-tool";

import { AppShell } from "@/flow/components/app-shell";
import { FrameImage } from "@/flow/components/frame";
import { DEMO_PROJECT, type Shot } from "@/flow/data/demo";
import { flowStore, useFlow } from "@/flow/lib/store";
import { runWebMCPTool } from "@/flow/lib/webmcp-telemetry";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flow/storyboard")({
  head: () => ({
    meta: [
      { title: "Storyboard — Flowaurora" },
      {
        name: "description",
        content: "The filmstrip board: every shot with its number, description, camera move and frame preview.",
      },
      { property: "og:title", content: "Storyboard — Flowaurora" },
      {
        property: "og:description",
        content: "A filmstrip grid of shots with camera notes and prismatic frame previews.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryboardPage,
});

function totalRuntime(shots: Shot[]) {
  const seconds = shots.reduce((acc, shot) => {
    const match = shot.duration.match(/(\d+)/);
    return acc + (match ? Number(match[1]) : 0);
  }, 0);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function ShotCard({ shot }: { shot: Shot }) {
  return (
    <article className="glass holo-edge group relative overflow-hidden rounded-2xl">
      <div className="relative">
        <FrameImage frame={shot.frame} tint={shot.tint} className="aspect-video" />
        <span className="absolute left-3 top-3 rounded-md bg-background/80 px-2.5 py-1 font-head text-[11px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm">
          {shot.scene} · Shot {shot.number}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 font-head text-[11px] font-semibold text-foreground backdrop-blur-sm">
          <Clock className="h-3 w-3" />
          {shot.duration}
        </span>
        <button
          onClick={() => {
            flowStore.removeShot(shot.id);
            toast(`Shot ${shot.number} removed from the board`);
          }}
          aria-label={`Delete shot ${shot.number}`}
          className="absolute right-3 top-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-head text-base font-bold uppercase tracking-wide">{shot.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {shot.description}
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Camera className="h-3.5 w-3.5 shrink-0 text-holo-cyan" />
          <span className="truncate">{shot.camera}</span>
        </div>
      </div>
    </article>
  );
}

function StoryboardPage() {
  const { shots } = useFlow();

  useWebMCP({
    name: "list_shots",
    description:
      "List the shots currently on the storyboard board, with scene labels, shot numbers, titles, camera notes and durations.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () =>
      runWebMCPTool("list_shots", () =>
        shots.length === 0
          ? "The board is empty."
          : shots
              .map(
                (shot) =>
                  `${shot.id}: ${shot.scene} · ${shot.number} — ${shot.title} (${shot.duration}; camera: ${shot.camera})`,
              )
              .join("\n"),
      ),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-head text-xs font-semibold uppercase tracking-[0.25em] text-holo-cyan">
              Project Board
            </p>
            <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-5xl">
              {DEMO_PROJECT.title}
            </h1>
            <p className="mt-3 text-muted-foreground">{DEMO_PROJECT.logline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="holo-edge glass rounded-full px-3 py-1 font-head text-[11px] font-semibold uppercase tracking-wider">
                Style · {DEMO_PROJECT.stylePreset}
              </span>
              <span className="glass rounded-full px-3 py-1 font-head text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {shots.length} shots
              </span>
              <span className="glass rounded-full px-3 py-1 font-head text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Runtime {totalRuntime(shots)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/flow/director"
              className="holo-edge inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-head text-[13px] font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              <Sparkles className="h-4 w-4" />
              Direct more shots
            </Link>
            <button
              onClick={() => {
                flowStore.resetDemo();
                toast("Demo project restored");
              }}
              className="glass inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-head text-[13px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </header>

        <div className="holo-rule my-10" />

        {shots.length === 0 ? (
          <div className={cn("glass rounded-2xl px-8 py-20 text-center")}>
            <p className="font-display text-2xl uppercase text-foreground/80">Board is empty</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Send the AI Director a logline and it will block out a full shot list for you.
            </p>
            <Link
              to="/flow/director"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-head text-[13px] font-bold uppercase tracking-wide text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Open AI Director
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shots.map((shot) => (
              <ShotCard key={shot.id} shot={shot} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

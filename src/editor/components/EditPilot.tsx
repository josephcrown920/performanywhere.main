import { Sparkles, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";

const PILOT_IDEAS = [
  "Merge clips into one smooth cohesive video",
  "Remove dead space and tighten the pacing",
  "Create hero-style bg effect, use dramatic bg animation, heroic vibe",
  "Beat sync: cut every clip on the music beat",
  "Speed ramp the action into bullet time",
  "Match cut my subject across every clip",
  "Auto-reframe everything to 9:16 for Reels",
  "Add a scroll-stopping UGC hook in the first 2 seconds",
  "Image: erase unwanted objects from the selected still",
  "Image: relight the subject with warm golden light",
  "Image: replace the background with a cinematic set",
  "Image: upscale and sharpen to studio quality",
];

/** CapCut-style Smart suggestions + EditPilot quick asks. Every button sends a real brief to the brain. */
export function EditPilot({ busy, onAsk, brief = "", onOptimize }: { busy: boolean; onAsk: (task: string) => void; brief?: string; onOptimize?: (text: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto flex items-center gap-1 text-xs font-semibold"><Wand className="size-3 text-accent" /> Prompt optimizer</p>
        <Button variant="outline" size="sm" disabled={busy || !brief.trim() || !onOptimize} onClick={() => onOptimize?.(`${brief.trim()}\n\nCreative direction: preserve the requested subject and action. Specify clear framing, natural lighting, coherent motion and clean pacing. Keep continuity with attached references.`)} className="h-7 text-[11px]">Optimize</Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => onAsk("Analyze my video: look at the frames and timeline, then list the 3 biggest improvements and apply the safe ones.")} className="h-7 gap-1 text-[11px]">
          <Sparkles className="size-3" /> Analyze
        </Button>
      </div>
      <details>
        <summary className="cursor-pointer text-[11px] text-muted-foreground">Smart suggestions</summary>
        <div className="flex flex-wrap gap-1.5">
          {PILOT_IDEAS.map((idea) => (
            <Button variant="ghost" key={idea} type="button" disabled={busy} onClick={() => onAsk(idea)} className="h-auto whitespace-normal text-left text-[11px]">{idea}</Button>
          ))}
        </div>
      </details>
    </div>
  );
}

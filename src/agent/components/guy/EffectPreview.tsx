import { useEffect, useRef } from "react";
import { FILTERS, type Preset } from "@/agent/lib/guy/engines";
import still from "@/agent/assets/guy/vfx-demo-still.jpg";
import { vfxClass } from "@/agent/components/guy/Terminal";

export function EffectPreview({ preset, source }: { preset: Preset; source?: string | undefined }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.playbackRate = Math.max(0.0625, preset.speed ?? 1);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void video.play().catch(() => {});
  }, [preset.speed, source]);
  return <span className="relative block h-16 w-full overflow-hidden bg-background">
    <video ref={ref} aria-label={`${preset.label} two-second demo`} src={source || undefined} poster={still} muted playsInline loop preload="metadata" className="h-full w-full object-cover" style={{ filter: FILTERS[preset.filter ?? "none"] ?? "none", opacity: preset.opacity ?? 1 }}
      onTimeUpdate={(e) => { const video = e.currentTarget; if (video.currentTime >= 2 * Math.max(0.0625, preset.speed ?? 1)) video.currentTime = 0; }} />
    {preset.filter && preset.filter !== "none" && <span aria-hidden className={vfxClass(preset.filter)} />}
  </span>;
}
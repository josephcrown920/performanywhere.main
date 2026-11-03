import { useEffect, useRef } from "react";
import { FILTERS, type Preset } from "@/lib/engines";
import demo from "@/assets/vfx-camera-demo.webm.asset.json";
import still from "@/assets/vfx-demo-still.jpg";
import { vfxClass } from "@/components/Terminal";

/** Two-second effect demo that plays while the pointer (or focus/touch) is on it. */
export function EffectPreview({ preset, source }: { preset: Preset; source?: string | undefined }) {
  const ref = useRef<HTMLVideoElement>(null);
  const rate = Math.max(0.0625, preset.speed ?? 1);
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate;
  }, [rate, source]);
  const play = () => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.playbackRate = rate;
    void video.play().catch(() => {});
  };
  const stop = () => {
    const video = ref.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };
  return <span className="relative block h-16 w-full overflow-hidden bg-background" onPointerEnter={play} onPointerLeave={stop} onFocus={play} onBlur={stop} onTouchStart={play}>
    <video ref={ref} aria-label={`${preset.label} preview — hover to play`} src={source || demo.url} poster={still} muted playsInline loop preload="metadata" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" style={{ filter: FILTERS[preset.filter ?? "none"] ?? "none", opacity: preset.opacity ?? 1 }}
      onTimeUpdate={(e) => { const video = e.currentTarget; if (video.currentTime >= 2 * rate) video.currentTime = 0; }} />
    {preset.filter && preset.filter !== "none" && <span aria-hidden className={vfxClass(preset.filter)} />}
  </span>;
}

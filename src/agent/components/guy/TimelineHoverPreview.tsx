import { useEffect, useRef } from "react";

export function TimelineHoverPreview({ url, time }: { url: string; time: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const seek = () => { video.currentTime = Math.max(0, Math.min(time, Number.isFinite(video.duration) ? video.duration : time)); };
    if (video.readyState >= 1) seek();
    video.addEventListener("loadedmetadata", seek);
    return () => video.removeEventListener("loadedmetadata", seek);
  }, [url, time]);
  return <video ref={ref} src={url} muted playsInline preload="auto" className="h-full w-full object-cover" />;
}
import { useEffect, useRef, useState } from "react";

export type StudioTab = "generator" | "timeline" | "storyboard" | "beats" | "workflows" | "photo" | "crew";

const paths: Record<StudioTab, string> = {
  generator: "/agent", timeline: "/agent/timeline", storyboard: "/agent/storyboard",
  beats: "/agent/beat-director", workflows: "/agent/workflows", photo: "/agent/photo-lab", crew: "/agent/studio",
};

export interface VideoStudioProps {
  /** Absolute URL of your hosted Perform Anywhere studio. Defaults to this origin. */
  studioUrl?: string;
  defaultTab?: StudioTab;
  title?: string;
  className?: string;
}

/** Portable React embed. The hosted studio owns accounts, tools, styles and providers. */
export function VideoStudio({ studioUrl, defaultTab = "timeline", title = "Perform Anywhere Video Studio", className = "" }: VideoStudioProps) {
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<"loading" | "loaded" | "slow" | "invalid">("loading");
  const [attempt, setAttempt] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      const base = new URL(studioUrl || window.location.origin);
      if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
        setStatus("invalid");
        return undefined;
      }
      setSource(new URL(paths[defaultTab], base.origin).href);
      setStatus("loading");
      const timer = window.setTimeout(() => setStatus((current) => current === "loading" ? "slow" : current), 20000);
      return () => window.clearTimeout(timer);
    } catch {
      setStatus("invalid");
      return undefined;
    }
  }, [studioUrl, defaultTab, attempt]);

  function handleLoad() {
    // Same-origin embeds can check for an error or blank document; cross-origin
    // browser protections prohibit this check, so onLoad is not a health guarantee.
    try {
      const doc = frame.current?.contentDocument;
      if (doc && !doc.body?.innerText.trim()) {
        setStatus("slow");
        return;
      }
    } catch { /* cross-origin embed */ }
    setStatus("loaded");
  }

  return (
    <section className={`video-studio-embed ${className}`} aria-label={title}>
      {status !== "loaded" && (
        <div className="video-studio-status" role="status">
          {status === "invalid" ? "Enter a valid studio web address." : status === "slow" ? "The studio is taking longer to open." : "Opening studio…"}
          {status === "slow" && (
            <div className="video-studio-recovery">
              <a href={source} target="_blank" rel="noopener noreferrer">Open studio in a new tab</a>
              <a href={source} onClick={(event) => { event.preventDefault(); setAttempt((n) => n + 1); }}>Retry</a>
            </div>
          )}
        </div>
      )}
      {source && status !== "invalid" && (
        <iframe key={`${source}:${attempt}`} ref={frame} src={source} title={title}
          className="video-studio-frame" onLoad={handleLoad}
          allow="autoplay; fullscreen; microphone; clipboard-write" allowFullScreen />
      )}
    </section>
  );
}
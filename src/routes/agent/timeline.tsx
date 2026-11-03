import { createFileRoute } from "@tanstack/react-router";
import "@/agent/aurora.css";
import { StudioNav } from "@/agent/components/studio/StudioNav";
import { MultiTrackTimeline } from "@/agent/components/video/MultiTrackTimeline";
import { LayersEditor } from "@/agent/components/video/LayersEditor";

export const Route = createFileRoute("/agent/timeline")({
  head: () => ({
    meta: [
      { title: "Multi-Track Timeline — Perform Anywhere" },
      { name: "description", content: "Arrange video and audio tracks, snap clips to beats, add effects and export a CapCut draft." },
      { property: "og:title", content: "Multi-Track Timeline — Perform Anywhere" },
      { property: "og:description", content: "V1–V4 video, A1–A3 audio, beat markers, split, trim and CapCut export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  return (
    <div className="aurora-body aurora-page">
      <StudioNav />
      <div className="aurora-wrap">
        <h1 className="aurora-page-title">Multi-Track Timeline</h1>
        <p className="aurora-page-sub">Four video tracks, three audio tracks, beat markers and CapCut export.</p>
        <MultiTrackTimeline />
        <LayersEditor />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { VideoStudio } from "@/agent/components/studio/VideoStudio";
import "@/agent/components/studio/video-studio-embed.css";

export const Route = createFileRoute("/agent/editor")({
  head: () => ({ meta: [
    { title: "Unified Video Editor — Perform Anywhere" },
    { name: "description", content: "The Out The Mud creative studio in one editor: timeline, workflows, photo tools, storyboard and agent." },
    { property: "og:title", content: "Unified Video Editor — Perform Anywhere" },
    { property: "og:description", content: "Create and edit with Aurora’s timeline, photo lab, workflows and creative director." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <div className="dark"><VideoStudio /></div>,
});
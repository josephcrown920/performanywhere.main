import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Orchestrate";

export const Route = createFileRoute("/orchestrate")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Orchestrate — Perform Anywhere" },
      { name: "description", content: "Generate text, images, video and audio with AI credits." },
      { property: "og:title", content: "Orchestrate — Perform Anywhere" },
      { property: "og:description", content: "Generate text, images, video and audio with AI credits." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

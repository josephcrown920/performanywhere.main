import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/WorkflowStudio";

export const Route = createFileRoute("/studio")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Studio — Perform Anywhere" },
      { name: "description", content: "Set up a new performance restage." },
      { property: "og:title", content: "Studio — Perform Anywhere" },
      { property: "og:description", content: "Set up a new performance restage." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Projects";

export const Route = createFileRoute("/projects/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Library — Perform Anywhere" },
      { name: "description", content: "Your performance projects and AI renders." },
      { property: "og:title", content: "Library — Perform Anywhere" },
      { property: "og:description", content: "Your performance projects and AI renders." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

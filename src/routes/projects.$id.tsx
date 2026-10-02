import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/ProjectDetail";

export const Route = createFileRoute("/projects/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Project — Perform Anywhere" },
      { name: "description", content: "Render status and output for your performance." },
      { property: "og:title", content: "Project — Perform Anywhere" },
      { property: "og:description", content: "Render status and output for your performance." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams(); return <Page id={id} />;
}

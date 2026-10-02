import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/PublicRender";

export const Route = createFileRoute("/r/$clientId/$projectId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared render — Perform Anywhere" },
      { name: "description", content: "Watch a performance restaged with AI." },
      { property: "og:title", content: "Shared render — Perform Anywhere" },
      { property: "og:description", content: "Watch a performance restaged with AI." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { clientId, projectId } = Route.useParams(); return <Page clientId={clientId} projectId={projectId} />;
}

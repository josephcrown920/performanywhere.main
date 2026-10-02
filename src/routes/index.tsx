import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Landing";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Perform Anywhere — Restage your performance with AI" },
      { name: "description", content: "Film a 30-second performance and restage it in any world with AI video models." },
      { property: "og:title", content: "Perform Anywhere — Restage your performance with AI" },
      { property: "og:description", content: "Film a 30-second performance and restage it in any world with AI video models." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

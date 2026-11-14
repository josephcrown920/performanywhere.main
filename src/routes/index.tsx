import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Landing";

const TITLE = "Perform Anywhere — By artists. For artists.";
const DESC = "Turn your phone performance into a new music-video world: build your scene, move into it, finish with your song.";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

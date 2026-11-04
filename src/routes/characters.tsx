import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Souls";

export const Route = createFileRoute("/characters")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Characters — Perform Anywhere" },
      { name: "description", content: "Lock a performer's face and look across every shot." },
      { property: "og:title", content: "Characters — Perform Anywhere" },
      { property: "og:description", content: "Lock a performer's face and look across every shot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Page />,
});

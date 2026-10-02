import { createFileRoute } from "@tanstack/react-router";
import Page from "@/views/Account";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Perform Anywhere" },
      { name: "description", content: "Session, credits and provider settings." },
      { property: "og:title", content: "Settings — Perform Anywhere" },
      { property: "og:description", content: "Session, credits and provider settings." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Page />;
}

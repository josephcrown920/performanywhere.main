import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Perform Anywhere" },
      { name: "description", content: "The rules for using Perform Anywhere, credits and AI-generated videos." },
      { property: "og:title", content: "Terms of Service — Perform Anywhere" },
      { property: "og:description", content: "The rules for using Perform Anywhere, credits and AI-generated videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14 text-foreground">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Perform Anywhere</Link>
      <h1 className="mt-6 font-display text-4xl">Terms of Service</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated October 28, 2026</p>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p><strong className="text-foreground">Your content.</strong> You keep ownership of what you upload and generate. Only upload media you have the right to use, and do not upload other people's likeness without their permission.</p>
        <p><strong className="text-foreground">Acceptable use.</strong> No illegal, hateful, sexual content involving minors, or deceptive deepfakes of real people. We may remove content or close accounts that break these rules.</p>
        <p><strong className="text-foreground">Credits.</strong> Credits are prepaid, used for generations, and are not redeemable for cash. Failed generations are refunded in credits.</p>
        <p><strong className="text-foreground">AI output.</strong> Generated videos may contain mistakes. The service is provided as is.</p>
        <p>Questions: contact support@auroraperformancestudio.com.</p>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Perform Anywhere" },
      { name: "description", content: "How Perform Anywhere handles your account, photos, videos and payments." },
      { property: "og:title", content: "Privacy Policy — Perform Anywhere" },
      { property: "og:description", content: "How Perform Anywhere handles your account, photos, videos and payments." },
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
      <h1 className="mt-6 font-display text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated October 28, 2026</p>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p><strong className="text-foreground">What we collect.</strong> Your email and sign-in details; the photos, videos and audio you upload; the prompts you write; the videos we generate for you; and your credit purchases.</p>
        <p><strong className="text-foreground">How we use it.</strong> Only to run the app: to generate and store your videos, keep your credits, and let you sign in on any device. We do not sell your data or use your uploads for advertising.</p>
        <p><strong className="text-foreground">AI processing.</strong> To create videos, your uploads and prompts are sent to AI service providers who process them on our behalf.</p>
        <p><strong className="text-foreground">Storage and sharing.</strong> Uploads and renders are stored privately and only visible to your account, unless you choose to share a render link.</p>
        <p><strong className="text-foreground">Payments.</strong> Card payments are handled by Paystack. We never see or store your card number.</p>
        <p><strong className="text-foreground">Deletion.</strong> You can delete projects in the app, or email us to delete your account and all of its data.</p>
        <p>Questions: contact support@auroraperformancestudio.com.</p>
      </div>
    </main>
  );
}

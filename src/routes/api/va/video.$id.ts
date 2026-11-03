import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, apiKey, passthrough } from "@/agent/lib/guy/gateway.server";
import { arkFetch, arkError } from "@/agent/lib/guy/ark.server";

export const Route = createFileRoute("/api/va/video/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (params.id.startsWith("ark_")) {
          const r = await arkFetch(`/contents/generations/tasks/${encodeURIComponent(params.id.slice(4))}`);
          if (!r.ok) return arkError(r);
          const t = (await r.json()) as { status?: string; error?: { message?: string } };
          return Response.json({ status: t.status, error: t.error });
        }
        return passthrough(await fetch(`${GATEWAY}/v1/videos/${encodeURIComponent(params.id)}`, { headers: { Authorization: `Bearer ${apiKey()}` } }));
      },
    },
  },
});

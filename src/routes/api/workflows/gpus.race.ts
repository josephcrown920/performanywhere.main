import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server-supabase";
import { defaultGpuCandidates, rankGpuCandidates } from "@/lib/workflow-engine/gpu-router";

export const Route = createFileRoute("/api/workflows/gpus/race")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const minVramGb = Number(url.searchParams.get("minVramGb") ?? 0) || 0;
        const freeOnly = url.searchParams.get("freeOnly") === "true";
        const candidates = rankGpuCandidates(defaultGpuCandidates(), minVramGb, freeOnly);
        return json({ candidates });
      },
    },
  },
});

export { json };

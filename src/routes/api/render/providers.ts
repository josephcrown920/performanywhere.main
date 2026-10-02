import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/render/providers")({
  server: {
    handlers: {
      GET: async () => {
        return json([
          { id: "lovable", label: "Lovable AI (Veo · Gemini Omni)", configured: true },
          { id: "kling", label: "Kling (direct)", configured: false },
          { id: "fal", label: "Fal.ai", configured: false },
          { id: "replicate", label: "Replicate", configured: false },
        ]);
      },
    },
  },
});

export { json };

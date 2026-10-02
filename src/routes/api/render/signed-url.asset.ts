import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, json, errJson } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/render/signed-url/asset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { path?: string; clientId?: string };
          assertClientId(body.clientId);
          const path = body.path ?? "";
          if (!path) throw new Error("path_required");
          const { data, error } = await serverSupabase().storage.from("uploads").createSignedUrl(path, 3600);
          if (error || !data) throw new Error(error?.message ?? "signed_url_failed");
          return json({ url: data.signedUrl });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});

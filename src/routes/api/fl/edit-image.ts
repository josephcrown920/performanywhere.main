import { createFileRoute } from "@tanstack/react-router";

import { isKnownModel } from "@/flow/lib/gateway-catalog.server";
import { editImage, imageSettings } from "@/flow/lib/image-gateway.server";

export const Route = createFileRoute("/api/fl/edit-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        try {
          const form = await request.formData();
          const model = form.get("model");
          if (typeof model === "string" && model && !(await isKnownModel(model))) {
            return new Response(`Model ${model} is not in the available model list`, { status: 400 });
          }
          const upstream = await editImage(
            imageSettings(apiKey, typeof model === "string" && model ? model : undefined),
            form,
            request.signal,
          );
          return new Response(upstream.body, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
              "Cache-Control": "no-cache",
            },
          });
        } catch (error) {
          if (request.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
            return new Response(null, { status: 499 });
          }
          throw error;
        }
      },
    },
  },
});

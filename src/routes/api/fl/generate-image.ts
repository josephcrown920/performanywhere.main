import { createFileRoute } from "@tanstack/react-router";

import { isKnownModel } from "@/flow/lib/gateway-catalog.server";
import { generateImage, imageSettings } from "@/flow/lib/image-gateway.server";

export const Route = createFileRoute("/api/fl/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        try {
          const { prompt, stream = true, model } = (await request.json()) as {
            prompt?: string;
            stream?: boolean;
            model?: string;
          };
          if (typeof prompt !== "string" || !prompt.trim()) {
            return new Response("A prompt is required", { status: 400 });
          }
          if (model && !(await isKnownModel(model))) {
            return new Response(`Model ${model} is not in the available model list`, { status: 400 });
          }
          const upstream = await generateImage(imageSettings(apiKey, model), prompt, stream, request.signal);
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

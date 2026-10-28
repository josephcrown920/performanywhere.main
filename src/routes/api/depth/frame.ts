import { createFileRoute } from "@tanstack/react-router";
import { json, errJson, authClientId } from "@/lib/server-supabase";
import { gatewayImageEdit } from "@/lib/ai/gateway";

// Turns one video frame (data URL) into a grayscale depth map: near = white, far = black.
export const Route = createFileRoute("/api/depth/frame")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const { image } = (await request.json()) as { image?: string };
          if (!image || !image.startsWith("data:image/") || image.length > 8_000_000) throw new Error("invalid_image");
          const url = await gatewayImageEdit(
            "google/gemini-3.1-flash-image",
            "Convert this exact frame into a monocular depth map. Output only the depth map: smooth grayscale, nearest surfaces pure white, farthest pure black, same framing and composition, no text, no color.",
            image,
          );
          return json({ depth: url });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});

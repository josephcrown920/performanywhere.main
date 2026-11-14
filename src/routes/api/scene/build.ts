import { createFileRoute } from "@tanstack/react-router";
import { json, errJson, authClientId } from "@/lib/server-supabase";
import { gatewayImageCompose, gatewayImage } from "@/lib/ai/gateway";
import { buildScenePrompt, type RefRole, type SceneMode } from "@/lib/scene-prompt";

const MODELS = ["google/gemini-3.1-flash-image", "openai/gpt-image-2"];
const ROLES = new Set<RefRole>(["identity", "outfit", "location", "pose", "prop", "interior"]);
const MODES = new Set<SceneMode>(["scene", "colors", "interior"]);

// Composes an approved target still from up to six reference photos.
export const Route = createFileRoute("/api/scene/build")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const body = (await request.json()) as { mode?: string; direction?: string; color?: string; aspectRatio?: string; refs?: Array<{ role?: string; image?: string }> };
          const mode = (MODES.has(body.mode as SceneMode) ? body.mode : "scene") as SceneMode;
          const refs = (body.refs ?? []).filter((r) => ROLES.has(r.role as RefRole) && typeof r.image === "string" && r.image.startsWith("data:image/")).slice(0, 6);
          const total = refs.reduce((n, r) => n + (r.image?.length ?? 0), 0);
          if (total > 20_000_000) return json({ error: "Reference photos are too large. Use smaller photos." }, 413);
          const direction = (body.direction ?? "").trim().slice(0, 1200);
          if (!refs.length && !direction && mode === "scene") return json({ error: "Add at least one reference photo or describe the scene." }, 400);
          const prompt = buildScenePrompt({ mode, roles: refs.map((r) => r.role as RefRole), direction, color: body.color?.slice(0, 40), aspectRatio: body.aspectRatio });
          let lastErr: unknown = null;
          for (const model of MODELS) {
            try {
              const image = refs.length
                ? await gatewayImageCompose(model, prompt, refs.map((r) => r.image as string))
                : await gatewayImage(model, prompt, { modalities: ["image", "text"] });
              return json({ image, model });
            } catch (e) { lastErr = e; }
          }
          throw lastErr ?? new Error("scene_build_failed");
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// ModelArk multi-agent session: "Aurora Cinematic Film Production Studio".
const SESSION_ID = "sesn-20260928051347-tbkle";
const MODEL = "dola-seed-2-1-turbo-260628";
const URL_ = `https://ark.ap-southeast.bytepluses.com/api/v3/sessions/${SESSION_ID}/chat/completions`;

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
    .min(1)
    .max(60),
});

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/va/agent-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["ARK_API_KEY"];
        if (!key) return json("The ModelArk key hasn't been added yet.", 500);
        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await request.json());
        } catch {
          return json("Invalid message.", 400);
        }
        const res = await fetch(URL_, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL, messages: body.messages, stream: true }),
          signal: request.signal,
        });
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          return json(`Agent error (${res.status}): ${text.slice(0, 400)}`, res.status || 502);
        }
        return new Response(res.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});

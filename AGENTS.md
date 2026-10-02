<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md — Technical rules

- Backend: all app-internal logic lives in TanStack server routes under `src/routes/api/**` (port of the original api-server). Public HTTP callers go under `src/routes/api/public/*` (e.g. paystack-webhook) and must verify the caller inside the handler.
- Identity model: no login. Every browser generates a UUID `client_id` (src/lib/client-id.ts); all tables are keyed by `client_id` and RLS is intentionally open to anon/authenticated (original app design). Don't add auth-scoped policies without changing this model.
- AI generation runs through the Lovable AI Gateway (`src/lib/ai/gateway.ts`): text/images via `/v1/chat/completions` (images come back at `choices[0].message.images[0].image_url.url` as data URLs); video via job endpoints `POST /v1/videos` → `GET /v1/videos/{id}` → clip downloaded from `/v1/videos/{id}/content` (follows redirect; the job URL expires, so `/render/poll` copies finished clips into the private `renders` bucket).
- Video model chain: google/veo-3.1-lite → google/gemini-omni-1.1-flash. Text: gemini-3.6-flash → gpt-5.6-luna → gemini-3.1-flash-lite. Image: gemini-3.1-flash-image → gpt-image-2.
- Credits: free providers (lovable/modelark/gemini/groq/cohere/pollinations/veo) cost 0; paid: 1/text, 50/image, 200/video-second, 75/audio. Spent/refunded atomically via the `spend_credits`/`grant_credits` security-definer RPCs.
- Paystack: initialize needs `PAYSTACK_SECRET_KEY` (returns 503 `paystack_not_configured` until set). Webhook at `/api/public/paystack-webhook` verifies the x-paystack-signature HMAC-SHA512 and grants 1 credit per 10 naira.
- Storage: private buckets `uploads` (project assets) and `renders` (finished clips); signed URLs minted server-side by `/api/render/signed-url/*`.
- `src/lib/supabase.ts` is a re-export of the generated `@/integrations/supabase/client`; views import from `@/lib/supabase`.

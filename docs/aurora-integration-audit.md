# Aurora Perform Anywhere integration audit

## Verified baseline
- Private repository `josephcrown920/performanywhere.main`, default branch `main`.
- TanStack Start / React 19 / TypeScript / Vite application.
- Existing routes include `/studio`, `/editor`, `/agent`, `/agent/timeline`, `/flow/canvas`, `/flow/storyboard`, `/motion-test`.
- `src/routes/editor/index.tsx` already imports timeline, AI agents, image/video generation, layers, lip sync, character lock, and workflow studio modules.
- `/agent/timeline` exposes a separate multitrack timeline and layers editor.
- `/motion-test` currently measures UI frame rate, not generative motion transfer quality.

## Integration contract
1. Preserve existing code and history; merge only after review and build checks.
2. Add scene preparation: character identity references, outfit selection, background/location, image generation.
3. Add performance-driving workflow: performer reference video + prepared character image -> provider-backed motion transfer -> generated shot.
4. Route provider requests through authenticated server endpoints. Never expose API keys to the browser, repository, logs, or client bundles.
5. Provide provider capability registry rather than assuming every requested model supports motion transfer. Verify model IDs, input formats, pricing, availability and capabilities before enabling.
6. Keep the timeline agent visible inside the editor itself; connect agent actions to selected clips, tracks, and project state.
7. Add end-to-end tests for upload, scene preparation, provider job start/poll, timeline insertion, export, failures and refunds/credit safety.
8. Do not trigger paid generation without explicit user approval of test spend.

## Outstanding dependency
The replacement source referred to as `Aurora Perform Anywhere` (`sites-project://appgprj_6af37f90ad448191963268ce43ef572b`) has not been exported or made accessible as source code in this GitHub repository. Obtain that source before replacing the existing implementation.

## Release gate
No deployment or production branch replacement until source comparison, secret audit, dependency install, build, unit tests, motion workflow tests, and manual preview pass.

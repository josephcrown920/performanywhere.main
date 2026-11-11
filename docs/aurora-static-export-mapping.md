# Aurora Perform Anywhere — uploaded static export mapping

Source: user-provided `aurora-perform-anywhere(1).zip` (22 ZIP entries, ~13.6 MB uncompressed). This export contains `dist/index.html`, `dist/assets/*`, and `.openai/hosting.json`; it does **not** contain React/TypeScript or server source.

## Verified interface elements
- Main performance directing page
- **Build a Scene** with reference inputs for avatar identity, outfit, location/background, pose/composition, optional car/prop
- **Colors Studio** scene preset
- **Luxury Interior** scene preset
- **Motion Control** section
- Approved target photo -> **Generate with Genjutsu** action
- Image assets include `person.jpeg`, `outfit.jpeg`, `track.png`, `car.png`, `colors-grid.jpeg`, `reference-demo.jpeg`, `result-demo.jpeg` and themed scenes.

## Implementation mapping
| Static export | Existing application integration |
|---|---|
| Build a Scene | `/studio` scene reference and identity workflow |
| Reference images | Existing editor media library / character lock |
| Colors Studio | Scene presets and lighting controls |
| Motion Control | Provider capability-driven generation interface |
| Genjutsu generation button | Server-backed authenticated job submission, polling and credit confirmation |
| Result preview | Insert generated asset into `/editor` timeline |
| Timeline agent | Surface existing agent controls inside editor |

## Safety and engineering notes
- The export is not a deployable full-stack replacement. Do not overwrite the existing React application with it.
- Do not present the static Genjutsu button as proof of working provider integration.
- Store provider keys only in server secrets. Never commit or render secrets.
- Preserve current `main` and make changes on `integration/aurora-perform-anywhere`.
- Before enabling paid provider calls, verify model capability, job API, estimated credits, refund behavior, and explicit spending approval.
- Copy visual assets from the supplied ZIP when performing the actual UI port; do not ship broken image references.

## Remaining work
Port the supplied HTML/CSS interactions to reusable React components, copy and optimize images, connect existing API endpoints, run typecheck/build/tests, validate a non-billable preview, and open a review PR.

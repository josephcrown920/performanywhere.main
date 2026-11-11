# Aurora Perform Anywhere — Google Play release preparation

## Current release readiness
This repository is a TanStack Start **web application** with server routes. There is no verified Android Gradle project, Capacitor config, signed AAB, or Play Console release. Do not submit the website source directly to Google Play or represent it as a tested Android build.

## Architecture choice
The application uses server-side rendering, authenticated project storage and server API routes. Deploy the web backend to HTTPS first. An Android shell (Capacitor or native WebView/TWA) must point to the deployed frontend, with all API routes working over HTTPS. A Trusted Web Activity requires a verified origin and Digital Asset Links. A Capacitor wrapper requires native Android project creation, correct deep links, permissions and file chooser handling.

## Required release checklist
- [ ] Successful CI build, tests and smoke test of editor, Soul upload, render start/poll and billing.
- [ ] Real Soul consistency test with consenting reference subject and at least two outputs; compare identity, log provider/model, cost and failures.
- [ ] Real Genjutsu provider credentials configured **server-side**; test paid render only with budget approval, confirmed endpoint and job receipt.
- [ ] Backend deployment with stable HTTPS domain and auth redirect URIs.
- [ ] Android wrapper project, app ID, adaptive icon, splash screen and Android manifest.
- [ ] Test image/video pickers, camera/microphone permission requests (only if used), playback, download, billing and sign-in on real Android device.
- [ ] Produce signed release **.aab** using a private signing key; never commit keystore or passwords.
- [ ] Complete Google Play developer account, app content declarations, privacy policy, data safety, age rating, testing requirements and store listing.
- [ ] Internal testing, pre-launch report and staged production rollout.
- [ ] Confirm Play Billing requirements for digital credits sold in an Android app; do not assume web checkout is allowed in the Play-distributed app.
- [ ] Implement clear credit pricing, generation consent, refund policy, usage ledger and payment webhook verification before monetizing.

## Proposed package metadata (confirm before signing)
Display name: Aurora Perform Anywhere
Suggested Android application ID: `com.outthemud.performanywhere` (**provisional**, must verify availability and ownership)
Version name: `0.1.0`
Initial version code: `1`
Orientation: portrait and landscape supported
Permissions: network, and user-selected media through system picker; avoid broad media/storage permissions.

## Secrets and security
Keep KIE_API_KEY and provider secrets in server-side deployment settings. Rotate any credential previously pasted in chat. Never put secrets in client bundles, Android resources, source control or Play Console listing.

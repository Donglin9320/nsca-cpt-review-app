# NSCA-CPT Review App

A personal NSCA-CPT study web app for daily quiz practice, wrong-answer review, progress tracking, and AI explanations (Kimi K3 by default).

## Live App

- Production: https://nsca-cpt-review-app.vercel.app/
- GitHub Pages fallback: https://donglin9320.github.io/nsca-cpt-review-app/

The Vercel app includes the `/api/kimi` serverless route used for AI explanations. Source changes take effect there only after a successful deployment.

## Features

- 1,438 practice questions across 7 NSCA-CPT units.
- Multiple-choice quiz interface with explanations for every answer option.
- Automatic wrong-answer notebook for missed questions.
- Daily goal tracking set to 150 questions.
- XP, streak, combo, milestone, and instant feedback interactions.
- Anatomy and movement-plane visual aids when available in the app data.
- Supabase Google login and per-account progress and wrong-answer storage.
- Saved question order, current question, and selected answer across sessions.
- Kimi K3 explanations through the Vercel API route and NVIDIA hosted inference.
- Optional inactive n8n daily reminders and weekly summaries; see [setup](n8n/README.md).

## Architecture

- Frontend: static `index.html`, `styles.css`, and `app.js`.
- Data bundle: `data.js`.
- Cloud sync: `cloud-config.js`, `cloud-sync.js`, and Supabase Row Level Security.
- AI API: `api/kimi.js` deployed as a Vercel serverless function.
- Deployment config: `vercel.json`.

The AI button works on the Vercel domain because the browser can call `/api/kimi` on the same origin. A local `file://` copy cannot run that API route or use the app's OAuth flow.

## Required Vercel Environment Variables

Set these values in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `NVIDIA_API_KEY`

Optional: `NVIDIA_MODEL`, default `moonshotai/kimi-k3`. Remove an old override such as `z-ai/glm-5.2` or replace it, then redeploy. NVIDIA's model catalog lists Kimi K3 as available as of 2026-10-05; successful inference with the production account still needs verification. Availability and trial limits can change.

References: [NVIDIA endpoint](https://build.nvidia.com/moonshotai/kimi-k3), [official open weights and license](https://huggingface.co/moonshotai/Kimi-K3). Hosted inference is not local model execution.

Do not expose any Supabase `service_role` key in frontend code.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_study_progress.sql` in the Supabase SQL Editor.
3. In Authentication URL Configuration, set the production URL as the Site URL.
4. Add the production URL to Redirect URLs.
5. Copy the Project URL and publishable key into `cloud-config.js`.
6. Enable Google under Auth Providers using a Google Web OAuth client. Set its authorized redirect URI to the callback URL displayed by Supabase. Keep the client secret in Supabase only.

Row Level Security is enabled so logged-in users can only read and write their own progress.

## Vercel Deployment

Import this repository into Vercel.

- Build Command: leave empty.
- Output Directory: leave empty.
- Root entry: `index.html`.
- `vercel.json` configures the `/api/kimi` function and service worker cache headers.

After deployment, verify the AI and sync flows:

1. Open the production URL.
2. Log in with Google.
3. Answer a question.
4. Click `询问 AI 助教`.
5. Confirm the response is returned through `/api/kimi`.
6. Confirm cloud sync succeeds after answering and refreshing restores the same question and notebook.

Local checks: `node --test tests/*.test.cjs`. These use mocks and do not prove live OAuth, database policies, model access, or email delivery.

## Response Speed and Save Reliability

AI explanations are cached in memory for 30 minutes (up to 50 exact prompts).
Revisiting the same question and selected answer in the same page session can reuse
the explanation without another model request. Regenerate bypasses this cache;
switching accounts clears it. A reload also clears it. This does not reduce the
provider's first-generation latency or shorten the educational explanation.

Concurrent token refreshes within a page share one request. Progress writes are
serialized within that page, and explicit logout uploads the latest local progress
before removing the session. Failed logout uploads keep the account signed in and
show an error so the upload can be retried. Supabase requests time out after 15 seconds.

Remaining limits: closing a tab is not the same as explicit logout, so a pending
upload may remain local until the next successful sync. Simultaneous edits from
different devices still use timestamp-based snapshot selection, not an answer-by-answer
merge. Cross-device conflict resolution and live OAuth flows need separate verification.

## Android Installation

Open the production URL in Android Chrome, then choose **Install app** or **Add to Home screen** from the browser menu.

## Local Notes

Use the production Vercel URL for the final app experience. Local static copies are useful for reading or packaging files, but they cannot directly run the Vercel API route unless served through the deployed project or an equivalent local serverless setup.

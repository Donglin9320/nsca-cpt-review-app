# Authentication, AI Diagnosis, and Integration Plan

Update: local n8n workflows, delivery ledger, protected notification API, and per-account quiz queue persistence are now implemented. See [n8n setup and activation](n8n/README.md). These have not been deployed or activated; the platform proposals below describe the earlier design context.

## Verification status (2026-10-05)

Local source inspection and seven mocked regression tests are complete. Production is NOT verified or repaired by this change. Terminal DNS requests failed in this execution environment; browser access to the production site was denied by the permission mechanism. Neither result proves that the production site or Supabase project is down. Vercel logs, environment values, Supabase project status, Google provider settings, and NVIDIA model access remain unverified. No cloud configuration was changed and no deployment was performed.

## Current request chain

Browser -> Supabase Auth -> access token -> Vercel `/api/kimi` -> Supabase `/auth/v1/user` -> NVIDIA hosted GLM -> answer.

The `study_progress` table stores learning progress. It is not queried by the AI endpoint. A table/RLS problem can break progress sync without necessarily breaking AI; an Auth outage can break both. The historical `kimi` route name currently calls GLM, not Kimi. The configured model identifier in source is `z-ai/glm-5.2`; its current availability has not been verified.

## Local fixes

- Replace email magic-link login with Google OAuth through the existing Supabase Auth service.
- Consume the existing implicit-flow token callback, clear it from the URL, and synchronize the authenticated user's progress.
- Display OAuth cancellation/failure instead of silently ignoring it.
- Preserve stored sessions on temporary network/server failures. Clear them only for authentication rejection.
- Distinguish Supabase service errors from invalid credentials in the AI endpoint.
- Bound Auth verification to 8 seconds and the subsequent model request to 45 seconds within the configured 60-second function duration.
- Update the service-worker cache version so deployed clients can receive the new login UI.

These changes address verified local weaknesses, not a confirmed root cause of the reported production incident.

## Enable Google login

1. In Google Cloud, configure an OAuth consent screen and a Web application OAuth client. If the app is in testing mode, include the intended Google account as a test user.
2. Set the Google client's authorized redirect URI to `https://lomchwyuuujzxdnoljuk.supabase.co/auth/v1/callback`.
3. In Supabase Authentication > Providers > Google, configure that client ID and client secret and enable the provider. Keep the secret out of frontend files and Git.
4. In Supabase Authentication > URL Configuration, set the Site URL and allowed redirect URL to `https://nsca-cpt-review-app.vercel.app/`. Add only exact development URLs needed for local testing.
5. Deploy the changed source to Vercel, open the app, click the Google login button, and finish login on Google's page.
6. Verify the Supabase user ID. Existing progress is keyed by this ID. Use the same verified email as the previous account and check identity linking; a different account may have no existing cloud progress. Do not delete either user's data to resolve this.
7. Answer a test question, wait for sync, and confirm it appears on a second device signed into the same account. Mocked tests do not establish live RLS or cross-device correctness.

Google login keeps the app's authenticated session and identifies the progress owner. It does not keep a browser process running in the background. Progress still depends on successful Supabase reads/writes. The existing sync strategy compares timestamps and chooses one snapshot; simultaneous offline edits are not merged question by question.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-google

## Diagnose the live AI failure

1. Confirm the Supabase project is active and Auth is healthy. A paused/unavailable project is a hypothesis, not an observed finding.
2. In Vercel, identify the deployed commit and inspect function logs for a failed `/api/kimi` request. Record HTTP status and duration without copying tokens or secrets.
3. Verify Production environment variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `NVIDIA_API_KEY` exist. Supabase URL and public key must belong to the frontend's project. Redeploy after environment changes.
4. Test Google login before AI. Check `/auth/v1/user`, then an authenticated `/api/kimi` call with a short question.
5. Classify the response: 401 = missing/rejected user session; 503 = missing server configuration or temporary Auth failure; upstream NVIDIA 401/403 = key/access problem; 402/429 = quota/rate issue; 404 = endpoint/model availability to investigate; 504 = timeout/network failure. Read the accompanying message because several causes share a status.
6. If a successful NVIDIA response contains no visible answer, inspect whether generation exhausted the output budget or returned a different response shape. Do not treat reasoning text as a substitute for a final answer or assume the answer key is correct.
7. Verify the final answer renders in the browser and that wrong-answer tracking and progress sync still work.

## Proposed platform roles

These are implementation proposals, not installed integrations or purchased services.

| Platform | Useful role in this app | Recommended timing |
| --- | --- | --- |
| n8n | Scheduled daily-goal reminders, weekly study summaries, operational alerts | First optional addition after Auth/AI recovery |
| Trigger.dev | Durable batch explanation generation, textbook processing, retryable long jobs | When a real task exceeds interactive request limits |
| DigitalOcean | Host n8n on a persistent server | Only if choosing self-hosting over managed n8n |

Keep Vercel for the app/API and Supabase for Auth/progress. These platforms connect through backend APIs and events; their admin interfaces should not be embedded into the learner's page.

### n8n: daily 150-question goal

Schedule in the user's timezone -> read today's completion count -> check explicit reminder opt-in -> send a reminder only when below 150 -> record the delivery. Weekly summaries can list weak topics and reviewed mistakes. Delivery credentials remain in n8n; do not place webhook secrets in browser JavaScript. Use authenticated server-to-server webhooks for app events. Deduplicate using user ID, local date, and notification type. Notifications require a chosen delivery channel and user consent before activation.

The current progress is a JSON snapshot. Inspect its actual daily-count fields before creating a workflow. If needed, add a minimal daily summary table keyed by `(user_id, study_date)` instead of giving automation unrestricted access to all study data. Reminder failure must not block answering or saving progress.

References:
- https://docs.n8n.io/
- https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/credentials/webhook.md

### Trigger.dev: background explanations

Authenticated Vercel endpoint -> validate the user and question IDs -> create an owned job record -> trigger a background task -> return the job ID -> task calls the model -> save a draft result -> app reads status/results under RLS.

Use idempotency keys based on user ID, question ID, and explanation version. Retry transient failures with limits; do not retry invalid credentials indefinitely. Keep model/service keys server-side, enforce job ownership, and preserve textbook citations. Generated explanations should remain drafts until reviewed, rather than silently replacing validated answer keys. Start with one small batch and measure completion time and cost.

Reference: https://trigger.dev/product

### DigitalOcean: optional n8n hosting

DigitalOcean provides an n8n marketplace deployment. A server would need a domain, HTTPS, persistent storage, backups, updates, and restricted administration access. Keep the existing study database in Supabase; n8n's internal database serves a different purpose. No server purchase is required to fix the present AI/login problem. Choose managed n8n or self-hosted n8n, then assess maintenance and current pricing before creating resources.

Reference: https://docs.digitalocean.com/products/marketplace/catalog/n8n/

## Acceptance checks before release

- Google login succeeds and cancellation is handled.
- Existing account progress remains accessible; no accidental overwrite or account switch.
- Cross-device wrong-answer and daily-goal progress sync works with RLS enabled.
- Authenticated AI returns a visible answer; expired login and upstream failures produce accurate messages.
- Mobile/PWA clients receive the new assets.
- No secrets appear in source, frontend responses, or logs.

Local regression command: `node --test tests/auth.test.cjs`.

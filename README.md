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

AI explanations are cached for 24 hours, with at most 50 exact prompts per account
in browser local storage and a bounded memory cache. Reloading preserves the local
cache; switching accounts clears memory and selects the other account's storage.
Regenerate bypasses cached answers. Exact prompt matching invalidates changed
questions/options, and `AI_CACHE_VERSION` must be bumped when explanation rules or
the configured model change. The cache contains study prompts and answers, not
credentials; it is not encrypted against other people using the same browser profile.
Storage errors fall back to memory. No incomplete/error response is cached.

Within one page, concurrent requests for the same account and exact prompt share
one model request, including regeneration while that request is still pending.
This does not deduplicate across tabs or devices. Network failures and explicitly
retryable 502/503 responses receive at most one retry after 500-999ms of jitter.
Authentication, quota, configuration, retired-model and timeout errors are not
automatically retried. No new retry starts after 35 seconds; both attempts share
the original 55-second deadline. A lost network response may still have incurred
provider work; this is not a guarantee of exactly-once execution or zero duplicate cost.
These changes do not shorten educational explanations or reduce first-generation
latency on a healthy provider.

The browser now bounds each model request (including reading its response body)
to 55 seconds, aborts stalled requests, and restores the retry button. The server
still bounds model generation to 45 seconds within its 60-second function budget.
Gateway timeout and quota errors have explicit messages. Length-truncated answers
are rejected rather than cached as complete explanations. Successful API responses
include `Server-Timing` for authentication and model latency; model connection
failures log only the model name, elapsed time, and timeout flag, never prompts,
emails, or tokens. These controls prevent indefinite waiting; they do not guarantee
provider availability or lower model latency. Live provider speed has not been
verified in this update.

Every API response writes a structured `ai_request` event to Vercel runtime logs:
stage, HTTP status, success/error/timeout outcome, total time, authentication time,
and model time. No prompts, email addresses, account IDs, keys or tokens are included.
To summarize extracted JSON event messages (one JSON object per line), run:

```sh
node scripts/summarize-ai-logs.cjs < ai-events.jsonl
```

The summary reports model-attempt success/timeout rates, auth failures, and P50/P95
of successful request/auth/model durations. Retries count as separate API attempts;
browser cache hits do not reach the API and are excluded. Missing samples return
null, not an invented zero-latency result. Log retention depends on the Vercel plan.
No new analytics service or user-tracking service has been added.

Concurrent token refreshes within a page share one request. Progress writes are
serialized within that page, and explicit logout uploads the latest local progress
before removing the session. Failed logout uploads keep the account signed in and
show an error so the upload can be retried. Supabase requests time out after 15 seconds.

Remaining limits: closing a tab is not the same as explicit logout, so a pending
upload may remain local until the next successful sync. Simultaneous edits from
different devices still use timestamp-based snapshot selection, not an answer-by-answer
merge. Cross-device conflict resolution and live OAuth flows need separate verification.

## UI Accessibility Rules

`ui.css` defines the study interface's visual tokens: 6px controls, 8px framed
content, and pill badges. System sans-serif fonts have explicit Chinese fallbacks;
no remote font download is required. Question headings use 28px on desktop and
23px on mobile; explanations and warning messages use 16px with generous line height.
Only menus and image dialogs have elevation shadows. Navigation uses opaque
backgrounds, avoiding stacked backdrop blur. The interface currently supports a
light theme only; it does not claim a separately validated dark palette.

Reduced-motion CSS disables animations and transitions while retaining static
answer feedback, XP, and progress text. Static regression tests cover palette
contrast and this CSS rule. Local Chrome checks covered 320, 390, 768, 1024, and
1440px widths without horizontal page overflow, plus correct/incorrect answer
states and the notes view. An actual OS reduced-motion toggle and low-end phone
performance were not tested. These checks do not access production account data.

## Android Installation

Open the production URL in Android Chrome, then choose **Install app** or **Add to Home screen** from the browser menu.

## Local Notes

Use the production Vercel URL for the final app experience. Local static copies are useful for reading or packaging files, but they cannot directly run the Vercel API route unless served through the deployed project or an equivalent local serverless setup.

# NSCA Study Emails: Setup and Activation

Status: local implementation and workflow exports only. No n8n instance, SMTP account, database migration, Vercel environment change, deployment, or real email delivery has been completed. The user selected their login email, Vancouver daily 20:00 reminders and Sunday 18:00 summaries.

## Included files

- `daily.json`: importable, inactive daily workflow. Suppresses reminders at 150+ answers.
- `weekly.json`: importable, inactive weekly workflow. Summarizes Monday through sending time on Sunday, daily goal completions, and this week's remaining notebook mistakes by unit.
- `notifications.sql`: creates a private delivery ledger, without changing learning records.
- `../api/study-notifications.js`: shared-secret protected backend, restricted to one configured account.
- `../lib/study-notifications.js`: date and summary rules; no LLM or extra model cost.

Both schedules use `America/Vancouver`, including daylight saving changes. The app's daily counter now uses the same timezone; historical browser-local day buckets are preserved, not retroactively reclassified. Counts are answer attempts, matching the existing app goal, not unique questions. Reopening an already answered current question does not award another attempt automatically.

## Prerequisites and setup

1. Create an n8n instance. The user must choose a plan and accept account terms; this repository does not purchase a subscription or provision a server. n8n Cloud is the simplest managed path; self-hosting is optional.
2. Complete Supabase Google OAuth setup using `../OPERATIONS_AND_INTEGRATIONS.md`. Log into the app with the desired account, then identify that user's UUID in Supabase Authentication > Users. Do not select an account by guessing its email.
3. Apply `notifications.sql` in that Supabase project's SQL Editor. Verify RLS remains enabled on `study_progress` with ownership policies from `../supabase/migrations/001_study_progress.sql`.
4. Configure these server-only Vercel Production environment variables, then deploy:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Existing project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing project's server-only service-role key; never a frontend variable |
| `N8N_NOTIFICATION_SECRET` | A randomly generated secret of at least 32 characters |
| `STUDY_NOTIFICATION_USER_ID` | The consenting account's Supabase UUID |
| `STUDY_NOTIFICATIONS_ENABLED` | Keep `false` until ready for a controlled test; set `true` to enable |

5. Import `daily.json` and `weekly.json` into n8n. Both are inactive. In both HTTP nodes of each workflow, select one HTTP Header Auth credential: header name `Authorization`, value `Bearer <N8N_NOTIFICATION_SECRET>`. Store the value in n8n credentials, not exported JSON.
6. Configure an SMTP credential for each Send email node, and replace `CONFIGURE_VERIFIED_SENDER` with an address authorized by the SMTP provider. The recipient comes from the verified Supabase account and cannot be specified by an API caller. A Google sign-in does not grant permission to send through Gmail; SMTP needs its own credential.
7. Run one controlled workflow test with notifications enabled and the owner account's cloud progress synced. For a daily test, progress must be below 150. Verify inbox receipt and a `sent` row in the ledger. If the goal is reached, no email is expected. No cloud progress row means no email, not zero completed questions.
8. Re-run the same workflow: it must skip an already sent period. Verify the weekly text against cloud progress. Then publish/activate both schedules and confirm their displayed timezone and next execution times.

No secrets should be pasted into chat. n8n receives the owner's email and study summary for delivery. Limit execution-log retention because failed executions may contain these fields. The backend holds the Supabase service-role key; n8n never needs it.

## Stop notifications

Unpublish/deactivate the two workflows, or set `STUDY_NOTIFICATIONS_ENABLED=false` and redeploy. This does not delete quiz records. The current release is an opt-in personal automation for ONE configured account, not automatic enrollment of every Google user. Per-account quiz persistence works separately for all users; multiple notification subscribers would require a subscription/preferences table and unsubscribe flow.

## Delivery guarantees and recovery

The endpoint atomically reserves `(user_id, kind, period)` before returning an email. SMTP runs next; a final callback marks it sent. A second execution skips a sent delivery and fails visibly with HTTP 409 for a pending delivery. Automatic resend is intentionally disabled. This prevents duplicate sends but is not an exactly-once guarantee: an interrupted workflow may leave an unsent or already sent email marked pending.

If pending, inspect the n8n execution and mail provider delivery record. If sent, rerun only the acknowledgment node with the original delivery ID. If positively confirmed unsent, remove only that reservation in Supabase and rerun. If delivery is uncertain, do not automatically release it. Never delete learning progress as part of delivery recovery.

The weekly report uses the current notebook and latest wrong timestamp per question. It does not reconstruct mistakes already removed from the notebook, full historical errors, or per-question historical accuracy. Counts reflect the last successful cloud sync, so unsynced offline practice may produce an unnecessary reminder. No email delivery failure blocks practice.

## Account progress and queue persistence

The app stores attempts, notebook entries, rewards, question IDs in order, active unit/mode, current question ID, and current selected answer inside the authenticated user's `study_progress.progress` JSON. Local caches are separated by Supabase user ID; the original unscoped cache is retained as guest data and is not silently assigned to a new account. Existing cloud records remain keyed by the same Supabase user ID.

Refresh and subsequent Google login restore the saved queue instead of shuffling it. Changing practice mode/unit intentionally starts a new queue. Added questions append and removed questions drop out when restoring. Existing records from before queue persistence cannot reconstruct their former shuffle order.

Cross-device persistence requires successful deployment, Google provider setup, correct live RLS policies, and successful sync. This remains snapshot-based sync, not collaborative merging: avoid simultaneous offline edits on different devices. The logout button exits the local session; other devices remain signed in.

## Tests and references

Run `node --test tests/*.test.cjs` from the repository root. These tests exercise logic with mocks, not a live n8n/Supabase/SMTP deployment. Regenerate JSON after generator changes with `node n8n/build-workflows.cjs`.

- Schedule and timezone: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/
- SMTP node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/
- Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google

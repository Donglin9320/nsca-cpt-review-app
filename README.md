# NSCA-CPT Review App

A personal NSCA-CPT study web app for daily quiz practice, wrong-answer review, progress tracking, and direct GLM-5.2 explanations.

## Live App

- Production: https://nsca-cpt-review-app.vercel.app/
- GitHub Pages fallback: https://donglin9320.github.io/nsca-cpt-review-app/

The Vercel production app is the source of truth because it includes the `/api/kimi` serverless route used for direct GLM-5.2 explanations.

## Features

- 1,438 practice questions across 7 NSCA-CPT units.
- Multiple-choice quiz interface with explanations for every answer option.
- Automatic wrong-answer notebook for missed questions.
- Daily goal tracking set to 150 questions.
- XP, streak, combo, milestone, and instant feedback interactions.
- Anatomy and movement-plane visual aids when available in the app data.
- Supabase email login and cross-device progress sync.
- Direct GLM-5.2 explanation flow through the Vercel API route.

## Architecture

- Frontend: static `index.html`, `styles.css`, and `app.js`.
- Data bundle: `data.js`.
- Cloud sync: `cloud-config.js`, `cloud-sync.js`, and Supabase Row Level Security.
- AI API: `api/kimi.js` deployed as a Vercel serverless function.
- Deployment config: `vercel.json`.

The direct GLM button works on the Vercel domain because the browser can call `/api/kimi` on the same origin. A local `file://` copy cannot run that API route.

## Required Vercel Environment Variables

Set these values in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `NVIDIA_API_KEY`

Do not expose any Supabase `service_role` key in frontend code.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_study_progress.sql` in the Supabase SQL Editor.
3. In Authentication URL Configuration, set the production URL as the Site URL.
4. Add the production URL to Redirect URLs.
5. Copy the Project URL and publishable key into `cloud-config.js`.

Row Level Security is enabled so logged-in users can only read and write their own progress.

## Vercel Deployment

Import this repository into Vercel.

- Build Command: leave empty.
- Output Directory: leave empty.
- Root entry: `index.html`.
- `vercel.json` configures the `/api/kimi` function and service worker cache headers.

After deployment, verify the GLM flow:

1. Open the production URL.
2. Log in with email.
3. Answer a question.
4. Click `直接问 GLM-5.2`.
5. Confirm the response is returned through `/api/kimi`.

## Android Installation

Open the production URL in Android Chrome, then choose **Install app** or **Add to Home screen** from the browser menu.

## Local Notes

Use the production Vercel URL for the final app experience. Local static copies are useful for reading or packaging files, but they cannot directly run the Vercel API route unless served through the deployed project or an equivalent local serverless setup.

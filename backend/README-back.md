# Job Match Assistant Backend

Express API and MongoDB data layer for account access, job discovery, saved listings, manual application tracking, saved company research, and Gemini writing tools.

**Live backend:** https://job-match-assistant-backend.onrender.com

## What it does

- Verifies email/password sign-in and Google ID tokens, then issues app session tokens.
- Restricts saved jobs and resume-check routes to authenticated users.
- Scopes MongoDB saved-job reads and status updates to the verified account.
- Finds remote software/data/AI listings through Remotive, RemoteOK, Hacker News, Jobicy, Himalayas, The Muse, Arbeitnow, RemoShift, RemoteJobs.org, and configured company-board adapters.
- Screens the AI track for technical AI/ML/LLM/prompt/NLP/vision roles and drops sales, training, annotation, and other non-engineering titles.
- Optionally adds USAJOBS, Reed, and Findwork when their API keys are configured.
- Provides Adzuna audio searches for Los Angeles and Newark/NYC, plus a Remotive remote audio source merged into the remote audio search. Remotive descriptions are normalized before audio scoring, and listings with too few recognized skill phrases return `matchScore: null`.
- Finds hybrid software/data/AI listings for the Los Angeles and Newark/NYC areas. Data analyst keyword searches include “entry level,” and explicit early-career language in titles or descriptions is classified ahead of unspecified levels.
- Reads company job boards from Greenhouse, Lever, Ashby, SmartRecruiters, and Workable (`data/companyBoards.js`).
- Refreshes every discovery source automatically every `JOB_REFRESH_HOURS` (default 12) and on startup. `/api/discover/status` reports the last and next refresh.
- Supports pasted-job skill previews and limited resume keyword checks.
- Saves account-scoped company profiles with user-entered research, job details, application answers, and generated interview questions and answers.
- Uses Gemini only on information supplied by the signed-in user; company lookups and invented experience are deliberately excluded.

The three fictional listings in `data/jobs.js` are test fixtures, not jobs displayed by the main real-job search.

## Run locally

From `backend/`:

```bash
npm install
npm run dev
```

The local API normally uses port `5003`. Render supplies its own `PORT`; the deployed server must listen on `0.0.0.0`.

Configure server-side variables privately:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Job app database connection |
| `JOB_AUTH_SECRET` | Signs and verifies app session tokens |
| `GEMINI_API_KEY` | Enables cover letters, fit explanations, company answers, and interview questions; server-side only |
| `GEMINI_MODEL` | Optional Gemini model override; defaults to `gemini-3.5-flash-lite` with a bounded fallback |
| `GOOGLE_CLIENT_ID` | Expected audience for verified Google ID tokens |
| `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` | Adzuna API access |
| `JOOBLE_API_KEY` | Jooble API access |
| `USAJOBS_API_KEY` and `USAJOBS_EMAIL` | Optional; enables the USAJOBS source when both are set |
| `REED_API_KEY` | Optional; enables the UK-focused Reed source |
| `FINDWORK_API_KEY` | Optional; enables the Findwork source |
| `FRONTEND_ORIGIN` | Exact allowed frontend origin for CORS |
| `TRUST_PROXY` | Optional; set to `1` behind a proxy. Enabled automatically when `NODE_ENV=production` or on Render (`RENDER=true`), which fixes express-rate-limit `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` errors |
| `GREENHOUSE_BOARD_TOKEN` | Optional; enables best-effort Greenhouse submission in `POST /api/apply`. Without it, apply falls back to opening the listing URL |
| `PORT` | Optional locally; supplied by Render |
| `MUSE_API_KEY` | Optional, only if configured for The Muse adapter |
| `JOB_REFRESH_HOURS` | Hours between automatic refreshes, 1–168; defaults to `12` |
| `DISABLE_JOB_REFRESH` | Set to `1` to turn off the background refresh (useful in tests) |

No-key sources: Remotive, RemoteOK, Jobicy, Himalayas, The Muse (key optional), Arbeitnow, RemoShift, RemoteJobs.org, and the Greenhouse/Lever/Ashby/SmartRecruiters/Workable public board endpoints.

Never commit `.env` or put backend secrets in Vite variables. Rotate any previously exposed credentials before relying on the deployment.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `POST /api/auth/signup` | Create email/password account |
| `POST /api/auth/login` | Email/password sign-in |
| `POST /api/auth/google` | Verify Google ID token and sign in |
| `GET /api/auth/me` | Retrieve authenticated user |
| `GET /api/discover/remote?track=software` | Remote software/data/AI search |
| `GET /api/discover/hybrid?track=software&area=los_angeles` | Hybrid software/data/AI search |
| `GET /api/discover/audio?area=los_angeles&mode=remote` | Audio search; accepts `area` (los_angeles/newark) and `mode` (in-person/hybrid/remote); remote mode adds Remotive audio jobs |
| `GET /api/discover/status` | Last/next automatic refresh and the configured cache TTL |
| `POST /api/apply` | Authenticated. Body: `{ source, sourceJobId, url, title, description }`. Best-effort source-aware submission (Greenhouse when `GREENHOUSE_BOARD_TOKEN` is set), otherwise returns the listing URL so the client can open it |
| `GET /api/saved-jobs?track=software` | List this user's saved jobs |
| `POST /api/saved-jobs/from-listing` | Save a discovered listing |
| `POST /api/saved-jobs` | Save a manually pasted job |
| `PATCH /api/saved-jobs/:id/status` | Update status, applied date, or legacy interview date |
| `PUT /api/saved-jobs/:id/interviews` | Replace interview rounds (date, round, contact, location, notes) |
| `POST /api/matches/custom` | Preview manually entered required skills |
| `POST /api/resume/compare-preview` | Manual resume phrase check |
| `POST /api/resume/keyword-overlap` | Keyword-overlap check |
| `GET /api/cover-letters?track=software` | List this user's cover-letter drafts |
| `POST /api/cover-letters` | Generate and save a cover-letter draft from user-entered text |
| `PATCH /api/cover-letters/:id` | Update a saved cover-letter draft |
| `DELETE /api/cover-letters/:id` | Delete a saved cover-letter draft |
| `POST /api/fit-explainer` | Generate an unsaved Gemini fit explanation from user-entered data |
| `GET /api/companies` | List this user's saved company profiles |
| `GET /api/companies/:id` | Retrieve one owned company profile |
| `POST /api/companies` | Save a company profile from user-entered company and job text |
| `PATCH /api/companies/:id` | Update an owned company profile |
| `DELETE /api/companies/:id` | Delete an owned company profile |
| `POST /api/companies/:id/answers` | Generate and save an answer to an application question using only profile/background text |
| `DELETE /api/companies/:id/answers/:answerId` | Delete a saved application answer |
| `POST /api/companies/:id/interview-questions` | Generate and save 12 practice interview questions from profile/background text |
| `POST /api/companies/:id/interview-answers` | Generate and save grounded practice answers for the saved interview questions |
| `PATCH /api/companies/:id/interview` | Save or edit the question list for a company, preserving answers for unchanged questions |

All `/api/cover-letters`, `/api/fit-explainer`, and `/api/companies` routes require the app session token. Gemini generation routes are rate limited. The repository may also expose `/api/jobs` and `/api/matches` for fictional test fixtures. Those endpoints do not return real vacancies.

## Matching limitations

A pasted job's fit score compares manually entered required skills with an editable skill list:

```text
score = max(1, round(matched entered skills / total entered required skills × 100) / 10)
```

Scores run from 1.0 to 10.0 with one decimal (for example, 9.5). A score of 8.0 or higher is a strong screening signal, but **not proof of qualification**. Keyword overlap is likewise not a verified match. Titles, source descriptions, seniority labels, location eligibility, education, and work authorization need review on the original listing.

Related spellings count as one skill: `LLM`, `LLMs`, and `large language models` share a group, as do `API`, `APIs`, and `REST APIs`. This prevents the same requirement from lowering or inflating a score more than once.

## Source and operational notes

- Link to each listing's original source. Keep required source attribution visible.
- Some descriptions are missing, truncated, or HTML-formatted. Do not execute source HTML in the browser.
- The Muse and RemoShift return `401`/`403` to some hosts. Those responses are treated as "no listings" so they do not produce a user-facing source warning; other sources still load.
- Source caches are in memory, use a TTL of `JOB_REFRESH_HOURS` (default 12), and reset on restart.
- A background scheduler warms every source on startup and then every `JOB_REFRESH_HOURS`. On hosts that sleep idle instances (for example, free tiers), the refresh runs the next time the instance wakes; use an external cron job if true wall-clock scheduling is required.
- `SavedJob` uses a per-owner unique index for discovered listings. Older ownerless saved jobs require deliberate migration.
- `CompanyProfile` documents are scoped by `ownerId`. They store user-entered company/job notes plus generated answers, interview questions, and interview answers; the owner field is excluded from API responses.
- The previously conflicting global `{ source, sourceJobId }` index was removed locally so separate users can save the same listing.
- Auth endpoints have a rate limiter. Review provider terms and package-audit findings before expanding public use.

## Deployment checks

The backend `/api/health` returned `{"status":"ok"}` on Render. That confirms the server responds, **not** that every source or private flow works in production. Check deployed Google sign-in, remote/audio discovery, saving, refresh, account isolation, and status updates before calling the full workflow verified. Also verify cover letters, fit explanations, saved company profiles, generated application answers, generated interview questions, and account isolation for the new company routes.

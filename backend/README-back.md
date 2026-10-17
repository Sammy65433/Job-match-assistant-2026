# Job Match Assistant Backend

Express API and MongoDB data layer for account access, job discovery, saved listings, and manual application tracking.

**Live backend:** https://job-match-assistant-backend.onrender.com

## What it does

- Verifies email/password sign-in and Google ID tokens, then issues app session tokens.
- Restricts saved jobs and resume-check routes to authenticated users.
- Scopes MongoDB saved-job reads and status updates to the verified account.
- Finds remote software/data listings through Remotive, Jobicy, Himalayas, The Muse, and configured company-board adapters.
- Provides Adzuna audio searches for Los Angeles and Newark/NYC.
- Includes an in-person software/data discovery route. Its source coverage and frontend connection still need verification.
- Supports pasted-job skill previews and limited resume keyword checks.

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
| `GOOGLE_CLIENT_ID` | Expected audience for verified Google ID tokens |
| `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` | Adzuna API access |
| `FRONTEND_ORIGIN` | Exact allowed frontend origin for CORS |
| `PORT` | Optional locally; supplied by Render |
| `MUSE_API_KEY` | Optional, only if configured for The Muse adapter |

Never commit `.env` or put backend secrets in Vite variables. Rotate any previously exposed credentials before relying on the deployment.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `POST /api/auth/signup` | Create email/password account |
| `POST /api/auth/login` | Email/password sign-in |
| `POST /api/auth/google` | Verify Google ID token and sign in |
| `GET /api/auth/me` | Retrieve authenticated user |
| `GET /api/discover/remote?track=software` | Remote software/data search |
| `GET /api/discover/in-person?track=software&area=los_angeles` | In-person software/data search |
| `GET /api/discover/audio?area=los_angeles` | Audio search; also accepts `newark` |
| `GET /api/saved-jobs?track=software` | List this user's saved jobs |
| `POST /api/saved-jobs/from-listing` | Save a discovered listing |
| `POST /api/saved-jobs` | Save a manually pasted job |
| `PATCH /api/saved-jobs/:id/status` | Update this user's manually tracked status |
| `POST /api/matches/custom` | Preview manually entered required skills |
| `POST /api/resume/compare-preview` | Manual resume phrase check |
| `POST /api/resume/keyword-overlap` | Keyword-overlap check |

The repository may also expose `/api/jobs` and `/api/matches` for fictional test fixtures. Those endpoints do not return real vacancies.

## Matching limitations

A pasted job's percentage compares manually entered required skills with an editable skill list:

```text
score = matched entered skills / total entered required skills × 100
```

A 60% screening estimate is **not proof of qualification**. Keyword overlap is likewise not a verified match. Titles, source descriptions, seniority labels, location eligibility, education, and work authorization need review on the original listing.

## Source and operational notes

- Link to each listing's original source. Keep required source attribution visible.
- Some descriptions are missing, truncated, or HTML-formatted. Do not execute source HTML in the browser.
- Source caches are in memory and reset on restart.
- `SavedJob` uses a per-owner unique index for discovered listings. Older ownerless saved jobs require deliberate migration.
- The previously conflicting global `{ source, sourceJobId }` index was removed locally so separate users can save the same listing.
- Auth endpoints have a rate limiter. Review provider terms and package-audit findings before expanding public use.

## Deployment checks

The backend `/api/health` returned `{"status":"ok"}` on Render. That confirms the server responds, **not** that every source or private flow works in production. Check deployed Google sign-in, remote/audio discovery, saving, refresh, account isolation, and status updates before calling the full workflow verified.

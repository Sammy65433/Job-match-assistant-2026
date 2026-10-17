# Job Match Assistant Backend

Express and MongoDB backend for a local job discovery and tracking prototype. It retrieves job listings, stores pasted jobs, and provides limited skill and keyword checks. It does not submit applications or verify that a candidate qualifies.

## Current capabilities

- Retrieves remote software and data listings through Remotive, Jobicy, and Himalayas adapters.
- Searches Adzuna for audio-related jobs near Los Angeles or Newark/NYC.
- Filters remote listings by job title, apparent seniority, and location text. A title labeled entry-level or a location mentioning the USA is **not verified eligibility**.
- Groups Adzuna audio results by title and short-preview relevance. These groups are search aids, not resume matches.
- Stores manually pasted jobs by career track in MongoDB and tracks a manually selected application status.
- Compares manually entered required skills with supplied skills.
- Checks whether phrases or profile keywords appear in supplied resume text. Keyword overlap is **not** a qualification score.
- Keeps the three fictional jobs in `data/jobs.js` for test use. The frontend's real-job search does not use them.

A dummy saved job remained after refresh, confirming MongoDB persistence. The keyword-overlap endpoint passed a dummy `curl` check. The most recent Jobicy adapter change adds `jobDescription`, but whether that field is populated in returned listings still needs checking.

## Structure

```text
backend/
├── data/
│   └── jobs.js
├── src/
│   ├── models/
│   │   └── SavedJob.js
│   ├── adzuna.js
│   ├── cache.js
│   ├── discover.js
│   ├── himalayas.js
│   ├── jobicy.js
│   ├── keywordOverlap.js
│   ├── match.js
│   ├── remotive.js
│   ├── resumeCompare.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Run locally

From `backend/`:

```bash
npm install
npm run dev
```

The server defaults to `http://127.0.0.1:5003` and requires a MongoDB connection before starting. Configure `PORT`, `MONGODB_URI`, `ADZUNA_APP_ID`, and `ADZUNA_APP_KEY` privately in `backend/.env` as applicable. Do not commit credentials, paste them into logs, or put them in frontend `VITE_` variables.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | API health check |
| `GET /api/jobs` | Fictional test jobs |
| `POST /api/matches` | Score fictional jobs against supplied skills |
| `POST /api/matches/custom` | Preview a pasted job using manually entered required skills |
| `GET /api/saved-jobs?track=software` | List MongoDB jobs for a track |
| `POST /api/saved-jobs` | Save a manually pasted job |
| `PATCH /api/saved-jobs/:id/status` | Manually update its tracking status |
| `GET /api/discover/remote?track=software` | Search aggregated remote software or data listings |
| `GET /api/discover/audio?area=los_angeles` | Search Adzuna audio listings near Los Angeles or Newark |
| `POST /api/resume/keyword-overlap` | Check overlap between supplied resume text and available listing text |

Valid tracks are `software`, `data`, and `audio`. The remote-discovery route accepts only `software` and `data`; the separate audio route accepts `los_angeles` or `newark`.

Check `server.js` before documenting `/api/resume/compare-preview` as available: the latest pasted `server.js` showed its helper import but did not show that route.

## Matching and discovery limitations

The manual required-skill preview uses equal weighting:

```text
score = matched manually entered required skills / total manually entered required skills × 100
```

The 60% review flag is a screening estimate, **not proof of qualification**. Discovery listings are not scored using verified required qualifications. Their titles and location strings are screening hints only.

`/api/resume/keyword-overlap` compares supplied text with the job title and any description supplied to it. API descriptions may be missing, incomplete, truncated, or contain HTML. A keyword appearing in a listing is not necessarily a requirement; a missing phrase does not prove the candidate lacks a skill.

Application status is a manual tracker. Changing a job to `applied` does not send an application. Review the `appliedAt` behavior before relying on it for corrections: the last shared route set the date when marking `applied` but did not clear it when changing back to `saved`.

## Source handling

Link users to each listing's original source. Remotive requires source attribution and links back to Remotive; its API advises infrequent fetching. Adzuna listings should use the returned redirect URL. Verify each provider's current terms, rate limits, attribution requirements, field mappings, and data retention rules before public use.

The current caches are in memory and reset when the backend restarts. `cache.js` does not yet deduplicate simultaneous requests for the same key.

## Security

The saved-job and resume-check routes do not have authentication. **Keep this backend local; do not deploy it publicly as-is.** Resume text sent for comparison is not saved by the comparison route, but it still reaches the local backend. Keep personal contact details out of test data. Do not commit `.env` or resume files.

## Next checks

1. Confirm whether the updated Jobicy adapter returns populated, usable description text without rendering its HTML as raw HTML.
2. Confirm which source adapters contribute listings and which return descriptions.
3. Connect job-card comparisons only after verifying available listing text. Label results *keyword overlap*, not qualification matches.
4. Add authentication and access controls before any public deployment or stored resume feature.

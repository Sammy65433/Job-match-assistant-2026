# Job Match Assistant Backend

Local Express API for comparing skills with sample jobs and saving pasted jobs by career track. This is a personal prototype, not an automated job-search or application service.

## Current state

- Three career tracks in the frontend: software engineer, data analyst, and audio engineer.
- Sample jobs are defined in `data/jobs.js`, not MongoDB.
- The API scores explicitly listed required skills against skills supplied by the frontend.
- Pasted jobs can be saved in MongoDB under a career track. A saved dummy job remained after a browser refresh, confirming local persistence.
- The frontend lets you filter sample results by remote status and minimum listed salary. These preferences do not change the skill score.
- Job descriptions are stored for context. The app does not extract requirements from them.
- No resume upload or parsing, live job search, user login, or application submission exists.

## Backend structure

```text
backend/
├── data/
│   └── jobs.js
├── src/
│   ├── models/
│   │   └── SavedJob.js
│   ├── match.js
│   └── server.js
├── .env                 # Local only; do not commit
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Local setup

From `backend/`:

```bash
npm install
```

Set `PORT` and `MONGODB_URI` privately in `backend/.env`. Use a database dedicated to this app. Do not put a MongoDB connection string in the Vite frontend or commit it to Git.

Start MongoDB if using a local instance, then run:

```bash
npm run dev
```

The API defaults to `http://127.0.0.1:5003`. Run the Vite frontend separately from `frontend/`. Its `VITE_API_URL` should point to this backend, not contain database credentials.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Check that the API is responding |
| `GET /api/jobs` | Return hard-coded sample jobs |
| `POST /api/matches` | Score sample jobs against supplied skills |
| `POST /api/matches/custom` | Preview one pasted job using explicitly entered required skills |
| `GET /api/saved-jobs?track=software` | List saved jobs for a track |
| `POST /api/saved-jobs` | Save a pasted job to MongoDB |

Valid saved-job tracks are `software`, `data`, and `audio`.

## Scoring limitations

The current formula weights every listed required skill equally:

```text
score = matched required skills / total required skills × 100
```

A score of 60% or more is marked for review. It is **not** evidence that you meet experience, education, licensing, location, or other requirements. A job with only one listed skill can score 100%, so review the full description before treating a match as promising.

The frontend currently calculates displayed scores for saved jobs using the selected track's editable skill list. Saved jobs do not include verified resume evidence.

## Security and deployment

The saved-job routes have no authentication. Keep this backend local for now; do not expose it publicly as-is. Keep `.env`, database credentials, resumes, and personal contact information out of the repository. If a database credential has been shared, rotate it.

## Where we left off

A dummy pasted job was saved and remained visible after refreshing the browser. MongoDB persistence is confirmed. Automatic job discovery has **not** been added.

## Next build step

Evaluate a job-listing source that permits API access and check its coverage for remote software/data roles and audio roles. Then add one backend-only integration, with filtering and manual review of results. Do not add automatic applications or resume sending at this stage.
































































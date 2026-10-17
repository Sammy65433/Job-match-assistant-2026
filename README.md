# Job Match Assistant

A personal job discovery and tracking prototype built with React/Vite, Express, and MongoDB.

I built this project to bring three job searches into one place: remote software engineering, remote data analytics, and audio-production opportunities near Los Angeles or Newark/NYC. It combines job-source APIs with a workspace for reviewing listings and tracking applications.

**Discovered jobs are search candidates, not verified resume matches.** The app does not submit applications or send resumes.

## Features

- Find real remote software and data listings through backend integrations with Remotive, Jobicy, and Himalayas.
- Search Adzuna for audio-related listings near Los Angeles and Newark/NYC.
- Screen software/data listings by title, apparent seniority, and location text.
- Group audio listings by apparent relevance using titles and short previews.
- Open listings on their source sites to read the full requirements.
- Paste jobs, enter their required skills, and save them to MongoDB by career track.
- Manually track a saved job's status: saved, ready, applied, interview, or rejected.
- Enter editable resume-evidence text and run limited phrase or keyword-overlap checks.

The frontend has **Find jobs** and **Resume and saved jobs** views. They switch within one URL rather than using separate browser routes.

## Architecture

```text
React/Vite frontend
    |
    | HTTP requests
    v
Express backend
    ├── Remotive, Jobicy, Himalayas: remote software/data discovery
    ├── Adzuna: location-based audio discovery
    ├── Matching helpers: manual skill checks and keyword overlap
    └── MongoDB: manually saved jobs and application statuses
```

External API credentials and the MongoDB connection belong on the backend. The browser does not connect directly to MongoDB or job-source APIs.

## Run locally

Use two terminals.

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The backend defaults to `http://127.0.0.1:5003`; Vite prints the frontend URL. See the backend and frontend READMEs for configuration and route details.

## What the results mean

Discovery screens listings using job titles and location strings. Labels such as “entry-level,” “USA mentioned,” or “likely related” are **review hints**, not eligibility decisions.

For a manually pasted job, an equal-weight required-skill calculation can produce a screening estimate. A 60% result is **not proof of qualification**. Keyword overlap only detects terms present in the available listing and resume text; it does not establish that those terms are required or that the applicant meets them.

## Current limitations

- Real listings are not reliably filtered by salary.
- Some providers return missing, truncated, or HTML-formatted descriptions. A recent check found no `description` in the first three returned Jobicy listings; a mapping change has been added but needs verification.
- The resume comparison does not upload or parse resume files. Resume text entered for checks is not saved by those routes.
- Application statuses are manual records. Marking a job “Applied” does not apply to it.
- No authentication protects the backend yet. **Run locally; do not deploy the current backend publicly.**
- Using the app repeatedly does not train it.

## Next steps

1. Verify job description mappings, source attribution, and provider terms.
2. Connect keyword-overlap checks to real listing cards **only where usable listing text exists**.
3. Improve salary and location handling without guessing missing data.
4. Add authentication and access controls before public deployment or stored resumes.
5. Consider application automation only where permitted by the source and employer, with explicit approval before sending a resume.

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for implementation details.

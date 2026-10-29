# Job Match Assistant

A full-stack job discovery and application tracker built with **React/Vite, Express, and MongoDB**.

I built this app to organize job searches across software engineering, data analytics, and audio production. It brings listings into one interface, lets users save opportunities, and tracks applications they submit on the employer’s site.

**Live app:** https://job-match-assistant-4frc.onrender.com

## What it does

- Searches remote software and data listings from Remotive, Jobicy, Himalayas, The Muse, Arbeitnow, RemoShift, and RemoteJobs.org.
- Optionally adds USAJOBS, Reed, and Findwork when their API keys are configured.
- Reads company boards from Greenhouse, Lever, Ashby, SmartRecruiters, and Workable.
- Refreshes all discovery sources automatically every 12 hours by default (`JOB_REFRESH_HOURS`) and shows the last refresh time in the results.
- Searches audio-related listings near Los Angeles and Newark/NYC through Adzuna.
- Includes backend work toward location-based software/data searches and company job-board sources. These integrations should be verified before presenting them as complete.
- Screens listings by title, apparent career level, and location text.
- Lets users save source-linked listings or paste jobs found elsewhere.
- Stores saved jobs and application statuses in MongoDB, scoped to each signed-in account.
- Supports email/password accounts and **Continue with Google**. Google verifies identity; MongoDB remains the account and job database.
- Provides editable career-track skills and limited resume-text phrase and keyword-overlap checks.
- Offers four views: **Find jobs**, **Preview a pasted job**, **Resume evidence**, and **Saved jobs**.

The app does **not** submit applications, send resumes, or decide whether someone qualifies for a role.

## Architecture

```text
React/Vite frontend
    │
    │ Authenticated HTTP requests
    ▼
Express API
    ├── Job-source adapters and cached discovery
    ├── Email/password and Google identity verification
    ├── Manual skill and keyword-overlap checks
    └── MongoDB: user accounts, saved jobs, application statuses
```

The frontend never connects directly to MongoDB. Job-source credentials and the app-auth signing secret stay on the backend.

## What “match” means

Discovery results are **search candidates**, not verified resume matches. Labels such as “entry-level,” “USA mentioned,” and “likely related” are screening hints based on available listing data.

For a pasted job, the app can compare **manually entered required skills** with an editable skill list and shows a **1.0–10.0 fit score** (8.0+ is a strong match). That score is a screening estimate, not proof of qualification. The resume tools identify phrase or keyword overlap; they do not verify experience, work authorization, or every requirement in the full listing.

**Applied** is a status the user selects after applying on the source site. It does not submit an application.

## Run locally

Use separate terminals:

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

The backend typically runs on `http://127.0.0.1:5003`. Vite prints its frontend URL. See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for configuration details. Do not commit `.env` files, resume text, or credentials.

## Current verification

Locally verified:

- Email/password and Google sign-in.
- Saving a discovered listing and seeing it again in **Saved jobs**.
- Account separation: a second account did not see the first account’s saved jobs.
- The Muse listing saved after its source was added to backend validation.

Still to verify before calling the deployment complete:

- The latest remote and in-person source integrations, including errors, attribution, and provider terms.
- Status-update isolation between accounts.
- Production login, Google OAuth origin, discovery, saving, and reload on Render.

## Deployment and security

The screenshot shows the app running on **localhost**, not Render. Once deployed and tested, replace the Live app placeholder above with the verified frontend URL.

Previously shared MongoDB, Adzuna, Google client-secret, and app-auth credentials must be rotated before deployment. Set replacements only in the backend’s private Render environment. The Google **client ID** may be used by the frontend; its client secret must not be.

Configure Google’s authorized JavaScript origins for the deployed frontend’s exact HTTPS origin. Configure backend CORS for that frontend origin. Never put MongoDB credentials, an Adzuna key, or `JOB_AUTH_SECRET` in a `VITE_` variable.

## Next steps

1. Finish validating each job source and its terms.
2. Verify account ownership for status updates, not only saved-job listing.
3. Rotate exposed credentials and test the full workflow on Render.
4. Improve listing relevance, including experience requirements hidden in descriptions.
5. Add salary and work-arrangement filters only where source data supports them.
6. Consider assisted applications only where an employer permits them, with user review and approval before submission.























































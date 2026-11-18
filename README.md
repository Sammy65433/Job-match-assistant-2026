# Job Match Assistant

A full-stack job discovery and application tracker built with **React/Vite, Express, and MongoDB**.

I built this app to organize job searches across software engineering, data analytics, audio production, AI engineering, and AI solutions development. It brings listings into one interface, lets users save opportunities, and tracks applications they submit on the employer’s site.

**Live app:** https://job-match-assistant-4frc.onrender.com

## What it does

- Searches remote software, data, AI engineering, and AI solutions listings from Remotive, RemoteOK, Hacker News, Jobicy, Himalayas, The Muse, Arbeitnow, RemoShift, and RemoteJobs.org.
- Optionally adds USAJOBS, Reed, and Findwork when their API keys are configured.
- Reads company boards from Greenhouse, Lever, Ashby, SmartRecruiters, and Workable.
- Refreshes all discovery sources automatically every 12 hours by default (`JOB_REFRESH_HOURS`) and shows the last refresh time in the results.
- Searches audio-related listings near Los Angeles and Newark/NYC through Adzuna.
- Includes backend work toward location-based software/data/AI searches and company job-board sources. These integrations should be verified before presenting them as complete.
- Screens listings by title, apparent career level, and location text.
- Lets users save source-linked listings or paste jobs found elsewhere.
- Stores saved jobs, application statuses, applied dates, and interview times in MongoDB, scoped to each signed-in account.
- Tracks applied jobs and interview rounds as a todo list in **Saved jobs**, with links back to each listing.
- Saves multiple interview rounds per job with date/time, round name, contact, location or meeting link, and notes.
- Supports email/password accounts and **Continue with Google**. Google verifies identity; MongoDB remains the account and job database.
- Provides editable career-track skills and limited resume-text phrase and keyword-overlap checks.
- Explains a listing's fit score in plain language with Google Gemini, including which skills are supported and which gaps to address.
- Generates tailored cover letters from a pasted company/job description and saves editable drafts to each account.
- Lets users save company notes and job details, generate application-question answers from only that information, and generate printable interview questions for practice.
- Builds direct search links for LinkedIn, Indeed, ZipRecruiter, Glassdoor, Lensa, Dice, Monster, and Google Jobs from editable keywords and the current work type/area, so searches can be run on those boards without APIs and applications can be completed manually.
- Offers six views: **Find jobs**, **Preview a pasted job**, **Resume evidence**, **Cover letter**, **Company & interviews**, and **Saved jobs**.

The app does **not** submit applications, send resumes, or decide whether someone qualifies for a role.

## External board search links

The **Find jobs** view includes an **Search other job boards** section. It turns editable keywords (defaulting to the selected career track) plus the current work type and area into ordinary search URLs:

| Board | What the link does |
| --- | --- |
| LinkedIn | Opens `/jobs/search/` with `keywords`, `location`, and the `f_WT` workplace filter |
| Indeed | Opens `/jobs` with `q` and `l` |
| ZipRecruiter | Opens `/jobs-search` with `search`, `location`, and `refine_by_location_type` |
| Glassdoor | Opens `/Job/jobs.htm` with `sc.keyword`; set the location on the site |
| Lensa | Opens the Lensa homepage with a **Copy search terms** helper, because a reliable keyword/location URL was not available |
| Dice | Opens `/jobs` with `q` and `location` |
| Monster | Opens `/jobs/search` with `q` and `where` |
| Google Jobs | Opens a Google Jobs results search for the same terms |

These are plain `<a>` links with `target="_blank" rel="noopener noreferrer"`. They are built entirely in the browser (`frontend/src/externalBoards.js`) using `new URL()` and `URLSearchParams`. No scraping, no hidden API calls, no credentials, and no listing data are exchanged with the app. Each board controls its own results, sign-in prompts, and application flow; jobs found there are not added to **Saved jobs** automatically. Use **Preview a pasted job** if you want to score and save one manually.

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
    ├── Google Gemini cover-letter, fit, application-answer, and interview-question generation
    └── MongoDB: user accounts, saved jobs, application statuses, cover letters, company profiles
```

The frontend never connects directly to MongoDB. Job-source credentials and the app-auth signing secret stay on the backend.

## What “match” means

Discovery results are **search candidates**, not verified resume matches. Labels such as “entry-level,” “USA mentioned,” and “likely related” are screening hints based on available listing data.

For a pasted job, the app can compare **manually entered required skills** with an editable skill list and shows a **1.0–10.0 fit score** (8.0+ is a strong match). That score is a screening estimate, not proof of qualification. The resume tools identify phrase or keyword overlap; they do not verify experience, work authorization, or every requirement in the full listing.

**Applied** is a status the user selects after applying on the source site. It does not submit an application.

## AI writing tools

Optional features call **Google Gemini** from the backend:

- **Explain this fit** sends the listing text, the applicant's skills or resume text, and the computed fit data to Gemini, which explains the score and names honest next steps. It is not saved.
- **Cover letter** sends the pasted company/job info, background text, tone, and contact details to Gemini. Generated letters are saved as editable drafts in MongoDB, scoped to the signed-in account.
- **Company & interviews** saves company notes, job details, application answers, and generated interview questions in MongoDB under the signed-in account. It sends only the user-entered company info, job info, background text, and contact details to Gemini. The app does not look up or scrape the company.
- **Interview questions** are practice prompts generated from that saved information. They are not guaranteed questions and can be printed from a clean print view.

All Gemini features use the backend-only `GEMINI_API_KEY`:

```dotenv
GEMINI_API_KEY=your_gemini_key
# GEMINI_MODEL=gemini-3.5-flash-lite
```

Never put the key in a `VITE_` variable. The default model is `gemini-3.5-flash-lite`; larger Gemini 3.x Flash tiers can return 503 or stall, and disabling their thinking output makes requests hang, so the client uses the lighter tier with default thinking settings. Override it with `GEMINI_MODEL` only if you have verified the replacement. AI output can be wrong or overstated, so review every letter, answer, explanation, and question before using it. Do not let the model claim experience, degrees, or skills that are not in the entered profile.

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

The backend typically runs on `http://127.0.0.1:5003`. Vite prints its frontend URL. See [`backend/README-back.md`](backend/README-back.md) and [`frontend/README.md`](frontend/README.md) for configuration details. Do not commit `.env` files, resume text, or credentials.

## Current verification

Locally verified:

- Email/password and Google sign-in.
- Saving a discovered listing and seeing it again in **Saved jobs**.
- Account separation: a second account did not see the first account’s saved jobs.
- The Muse listing saved after its source was added to backend validation.
- Cover letters, fit explanations, company answers, and interview questions using the local Gemini configuration.
- `/api/companies` create/read/update/delete, generated-content persistence, and account isolation against an isolated temporary database.
- Frontend lint/build plus a headless-browser DOM and layout check of the **Company & interviews** view.

Still to verify before calling the deployment complete:

- The latest remote and in-person source integrations, including errors, attribution, and provider terms.
- Status-update isolation between accounts.
- Production login, Google OAuth origin, discovery, saving, and reload on Render.
- Production Gemini generation and the new company routes after the next deployment.

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







































































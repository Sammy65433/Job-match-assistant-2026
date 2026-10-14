# Job Match Assistant

A personal job-match assistant for finding and reviewing roles across three career tracks:

- **Software engineering:** primarily remote junior software, frontend, backend, and full-stack roles.
- **Data analytics:** primarily remote analyst, reporting, BI, and ETL roles.
- **Audio engineering:** recording, vocal engineering, audio editing, studio, and related production roles. Location preferences will be refined for the Los Angeles and Newark/NYC areas, with relocation considered.

The goal is to find relevant jobs, explain potential matches, and support **manual review**. The app does not apply to jobs or send resumes.

## Current status

This is a local prototype built with React/Vite, Express, and MongoDB.

**Working:**

- Select a career track and edit its skill list.
- Score three hard-coded sample jobs.
- Paste a job description and manually enter its required skills to preview a match.
- Save pasted jobs to MongoDB by career track.
- View saved jobs and their skill-match estimates.
- Filter sample-job results by remote status and minimum listed salary.
- MongoDB persistence was confirmed by saving a dummy job and seeing it remain after a browser refresh.

**Not built yet:**

- Automatic job discovery or a job-listing API.
- Resume file upload, parsing, or evidence-based qualification checks.
- Automatic extraction of requirements from job descriptions.
- Saved location preferences or reliable location filtering for pasted jobs.
- User authentication or access controls.
- Application submission, email sending, or job-board credential storage.

Using the app repeatedly does **not** train it or cause it to discover jobs automatically.

## How matching works today

The current score compares the selected track’s editable skills with a job’s explicitly entered required skills. Each required skill has equal weight:

```text
skill-match score = matched required skills / total required skills × 100
```

Jobs scoring at least **60%** are marked for review. This is a **screening estimate**, not proof of qualification. Experience, education, work authorization, location, and other requirements are not verified by the score. A job listing only one required skill can score 100%, even when the full role is not a good fit.

Job descriptions provide context but are **not automatically interpreted or scored**.

## Project structure

```text
Job-Assistant-Tracker/
├── backend/
│   ├── data/
│   │   └── jobs.js
│   ├── src/
│   │   ├── models/
│   │   │   └── SavedJob.js
│   │   ├── match.js
│   │   └── server.js
│   └── README.md
├── frontend/
│   └── src/
│       └── App.jsx
└── README.md
```

## Run locally

Use separate terminals for the backend and frontend.

**Backend:**

```bash
cd backend
npm install
npm run dev
```

The backend requires a private `backend/.env` containing its MongoDB connection setting. See `backend/README.md` for backend details. Do not commit `.env` or put database credentials in frontend `VITE_` variables.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend should point to the local backend on port `5003`. Vite prints its own browser URL when it starts; its port may vary.

## Privacy and deployment

This app is currently intended for **local use only**. Saved-job routes do not have authentication, so do not deploy the current backend publicly. Do not commit resumes, personal contact details, database credentials, or job-board credentials.

If resume uploads are added later, files and any credentials must be handled on the backend with authentication and access controls.

## Next milestone

Choose a job-listing source that **permits API access** and covers the desired software, data, and audio roles. Integrate it through the backend, then filter and score fetched jobs for manual review.

Only consider application automation where the employer and source explicitly allow it. Every application must be reviewed and approved before a resume is sent.

# Job Match Assistant Frontend

React/Vite interface for finding listings and managing a personal job-review workspace.

## Views

**Find jobs**

- Select software, data, or audio.
- Search real remote software/data listings through the Express backend.
- Search Adzuna audio listings by Los Angeles or Newark area.
- Open each listing on its source site to review full requirements.

**Resume and saved jobs**

- Paste and preview a job using manually entered required skills.
- Save pasted jobs by career track.
- Enter editable resume-evidence text.
- Check limited keyword overlap for saved jobs.
- Manually update saved-job application status.

These are two views on the same URL, not separate browser routes.

## Run locally

From `frontend/`:

```bash
npm install
npm run dev
```

Point `VITE_API_URL` to the local backend, typically:

```dotenv
VITE_API_URL=http://127.0.0.1:5003
```

Vite prints the frontend browser URL. Its port can vary. Never put MongoDB URIs, Adzuna credentials, resumes, or other secrets in `VITE_` variables.

## Main source files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | View state, API calls, and shared career-track state |
| `src/JobSearchForm.jsx` | Real-job search form |
| `src/RemoteJobs.jsx` | Remote software/data results |
| `src/AudioJobs.jsx` | Adzuna audio-area results |
| `src/ResumeComparison.jsx` | Editable resume evidence and manual phrase checks |
| `src/ResumeJobCheck.jsx` | Keyword-overlap control currently used with saved jobs |
| `src/tracks.js` | Track labels, starter skills, and skill parser |

## Limitations

- The frontend does not submit applications or upload resume files.
- Discovery listings are not verified resume matches.
- Editable skills do not yet filter discovered listings.
- Salary filtering for real listings is not available.
- A job source may provide no description; a title-only keyword check is too limited to call a job match.
- Resume text entered into the page is sent to the local backend when checked. Avoid including contact details until proper authentication and access controls exist.

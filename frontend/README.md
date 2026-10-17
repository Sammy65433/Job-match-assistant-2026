# Job Match Assistant Frontend

React/Vite interface for discovering jobs and tracking applications submitted on external sites.

**Live frontend:** https://job-match-assistant-4frc.onrender.com

## Account access

The app opens on a dedicated sign-in screen. Users can create an email/password account or use **Continue with Google**. The frontend sends an app-issued session token to protected Express API routes; MongoDB stores user accounts and saved jobs. The token is held in page memory, so refreshing requires signing in again.

## App tabs

- **Find jobs:** Choose a career track, search listings, open their original source links, and save a listing.
- **Preview a pasted job:** Enter a job found elsewhere and its required skills for a screening estimate.
- **Resume evidence:** Enter editable resume text and manually reviewed requirements for phrase checks.
- **Saved jobs:** Read saved listings, expand descriptions, open application links, check limited keyword overlap, and manually update application status.

These tabs switch views in `App.jsx`; they are not separate browser URLs.

## Job discovery

Software and data listings use the backend's remote search, including Remotive, Jobicy, Himalayas, and newer The Muse/company-board integrations. Audio uses the Adzuna Los Angeles/Newark search. A backend in-person software/data route has been added; do not claim an in-person frontend control works until it is connected and tested.

“Entry-level” and location labels are screening hints. A title without a level may still require years of experience. Search results are **not verified resume matches**.

## Run locally

From `frontend/`:

```bash
npm install
npm run dev
```

Set local Vite variables privately in `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:5003
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
```

For the deployed Static Site, configure `VITE_API_URL` with the deployed backend origin and `VITE_GOOGLE_CLIENT_ID` with the Google Web client ID. Vite embeds these values in the public build. **Never put MongoDB credentials, the Adzuna key, a Google client secret, or `JOB_AUTH_SECRET` in `VITE_` variables.**

## Main source files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Signed-in tabs, search state, saved jobs, and authenticated requests |
| `src/LoginPage.jsx` | Dedicated sign-in screen |
| `src/JobAuth.jsx` | Email/password and Google sign-in controls |
| `src/api.js` | Frontend API requests and app-token header |
| `src/JobSearchForm.jsx` | Search form |
| `src/RemoteJobs.jsx` | Remote software/data listings and source attribution |
| `src/AudioJobs.jsx` | Adzuna audio listings |
| `src/SaveListingButton.jsx` | Save discovered listings |
| `src/ResumeComparison.jsx` | Manual resume phrase checks |
| `src/ResumeJobCheck.jsx` | Keyword overlap for saved jobs |
| `src/descriptionText.js` | Convert HTML-formatted job descriptions to displayed plain text |
| `src/tracks.js` | Career-track labels and editable skill defaults |

## Limitations

- The app does not submit applications or send resumes. “Applied” is a manual status.
- Editable skills do not filter discovered listings yet.
- Real-listing salary filtering is not implemented.
- Some job sources provide incomplete descriptions. Keyword overlap does not establish qualification.
- Resume text is sent to the backend for checks, but those checks do not save it as a profile.

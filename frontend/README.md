# Job Match Assistant Frontend

React/Vite interface for discovering jobs and tracking applications submitted on external sites.

**Live frontend:** https://job-match-assistant-4frc.onrender.com

## Account access

The app opens on a dedicated sign-in screen. Users can create an email/password account or use **Continue with Google**. The frontend sends an app-issued session token to protected Express API routes; MongoDB stores user accounts and saved jobs. The token is held in page memory, so refreshing requires signing in again.

## App tabs

- **Find jobs:** Choose a career track, search listings, open their original source links, save a listing, and open pre-filled searches on other major boards for manual applications.
- **Preview a pasted job:** Enter a job found elsewhere and its required skills for a screening estimate.
- **Resume evidence:** Enter editable resume text and manually reviewed requirements for phrase checks.
- **Cover letter:** Paste a company/job description, generate a tailored letter with Gemini, edit it, copy or download it, reopen saved drafts, and carry the company details into interview prep.
- **Company & interviews:** Save company notes and job details, generate grounded answers to application questions, generate likely interview questions and practice answers, edit and save the question list, print or download the Q&A, and send the details back to the cover letter form.
- **Saved jobs:** Read saved listings, expand descriptions, open application links, check limited keyword overlap, explain the fit, write a cover letter, and manually update application status.

These tabs switch views in `App.jsx`; they are not separate browser URLs.

## Job discovery

Software, data, AI engineering, and AI solutions listings use the backend's remote and hybrid search, including Remotive, Jobicy, Himalayas, and newer The Muse/company-board integrations. Audio uses the Adzuna Los Angeles/Newark search, plus a Remotive source merged into the remote audio search. Remotive descriptions are carried into audio scoring, so ratings use the same title-and-text skill overlap as other tracks; listings with fewer than three recognized skill phrases show **Not rated**. The AI solutions developer track shares the software/data remote and hybrid pipelines and filters titles for AI, machine learning, LLM, and prompt-engineering roles. The AI engineer track uses the same pipelines with a narrower engineering/development title filter and a separate skill vocabulary covering RAG, embeddings, vector databases, model evaluation, MLOps, and deployment. Configured keyword searches for the data analyst track include “entry level,” and explicit new-grad/early-career titles and descriptions are surfaced first. A backend in-person software/data route has been added; do not claim an in-person frontend control works until it is connected and tested.

“Entry-level” and location labels are screening hints. A title without a level may still require years of experience; it is kept in a separate “Level unspecified” group. Search results are **not verified resume matches**.

## Other job boards (no API)

The **Find jobs** tab also has a **Search other job boards** section. It builds ordinary search URLs for LinkedIn, Indeed, ZipRecruiter, Glassdoor, Lensa, Dice, Monster, and Google Jobs from editable keywords and the current work type/area. The URLs are constructed client-side with `new URL()` in `src/externalBoards.js`; each link opens in a new tab with `rel="noopener noreferrer"`. Nothing is scraped, no API key is used, and no listings are imported or scored from these boards. Lensa has no reliable keyword/location URL, so its card opens the site and offers a **Copy search terms** button instead. Applications are completed manually on each board.

## Company & interviews

The **Company & interviews** tab stores a company profile on the signed-in account: company name, website, user-entered research notes, job title, job description, generated application answers, and generated interview questions and answers. The applicant background text comes from the editable **Your background / resume text** field for the selected career track.

Gemini receives only those user-entered fields. The app does not look up the company, scrape a careers page, or add facts that are not in the entered text. Generated answers are saved as editable records under the company and can be copied or deleted. Interview questions and their practice answers are saved with the company, and the question list can be edited or extended from the **Edit or add questions** box. **Save questions to this company** persists changes; answers for unchanged questions are kept.

Interview content is practice material, not guaranteed. **Print / Save PDF** opens a clean print frame with the company name, questions, and answers that can be saved as a PDF from the browser. **Download .txt** creates a plain-text Q&A file.

**Use for interview prep** in the cover letter view carries the company name, role, company/job description, background text, and contact details into this tab. If a company with the same name is already saved, that profile is opened and only its empty fields are filled from the cover letter. **Back to cover letter** returns the company details without clearing the letter you were editing.

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

Cover letters, fit explanations, company answers, and interview questions need `GEMINI_API_KEY` in the backend environment. The key is used only by the Express server and must never be added to a `VITE_` variable.

## Main source files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Signed-in tabs, search state, company profiles, saved jobs, and authenticated requests |
| `src/LoginPage.jsx` | Dedicated sign-in screen |
| `src/JobAuth.jsx` | Email/password and Google sign-in controls |
| `src/api.js` | Frontend API requests and app-token header |
| `src/JobSearchForm.jsx` | Search form |
| `src/ExternalJobBoards.jsx` | Editable external-board search links and copy helper |
| `src/externalBoards.js` | Builds safe outbound search URLs from keywords/location/work type |
| `src/RemoteJobs.jsx` | Remote software/data listings and source attribution |
| `src/AudioJobs.jsx` | Adzuna audio listings |
| `src/SaveListingButton.jsx` | Save discovered listings |
| `src/ResumeComparison.jsx` | Manual resume phrase checks |
| `src/ResumeJobCheck.jsx` | Keyword overlap for saved jobs |
| `src/components/CoverLetterView.jsx` | Gemini cover-letter form, editor, drafts, copy, download, and print |
| `src/components/CompanyView.jsx` | Saved company profiles, application Q&A, interview prep, and print view |
| `src/components/FitExplainer.jsx` | Gemini plain-language fit and gap explanation |
| `src/profileDefaults.js` | Shared editable contact defaults for cover letters and company answers |
| `src/resumeStarters.js` | Shared starter background text per career track |
| `src/descriptionText.js` | Convert HTML-formatted job descriptions to displayed plain text |
| `src/tracks.js` | Career-track labels and editable skill defaults |

## Limitations

- The app does not submit applications or send resumes. “Applied” is a manual status.
- External-board links open the board's own search; their listings are not imported, scored, or saved in this app.
- Editable skills do not filter discovered listings yet.
- Real-listing salary filtering is not implemented.
- Some job sources provide incomplete descriptions. Keyword overlap does not establish qualification.
- Resume text is sent to the backend for checks, but those checks do not save it as a profile.
- AI-generated cover letters, fit explanations, application answers, interview questions, and interview answers can be incomplete or wrong. They use only the text provided, but every claim still needs review.
- Cover-letter drafts store the pasted job text and background text used to generate them; delete drafts you no longer need.
- Company profiles store user-entered notes, job text, generated answers, and generated interview questions on the account; delete a company or individual answer when it is no longer needed.
- Printed interview questions are practice prompts, not questions guaranteed by the employer.

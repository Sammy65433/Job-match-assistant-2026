import { useEffect, useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  ClipboardPaste,
  FileCheck2,
  LogOut,
  Search
} from "lucide-react";

import "./App.css";
import { TRACKS, parseSkills } from "./tracks.js";
import JobSearchForm from "./JobSearchForm.jsx";
import RemoteJobs from "./RemoteJobs.jsx";
import AudioJobs from "./AudioJobs.jsx";
import ResumeComparison from "./ResumeComparison.jsx";
import ResumeJobCheck from "./ResumeJobCheck.jsx";
import LoginPage from "./LoginPage.jsx";
import { apiRequest } from "./api.js";
import { descriptionText } from "./descriptionText.js";

const STATUS_LABELS = {
  saved: "Saved",
  ready: "Ready to apply",
  applied: "Applied (marked by me)",
  interview: "Interview",
  rejected: "Closed / rejected"
};

const TABS = [
  ["jobs", "Find jobs", Search],
  ["preview", "Preview a pasted job", ClipboardPaste],
  ["resume", "Resume evidence", FileCheck2],
  ["saved", "Saved jobs", Bookmark]
];

export default function App() {
  const [page, setPage] = useState("jobs");
  const [track, setTrack] = useState("software");
  const [auth, setAuth] = useState(null);

  const [skillsByTrack, setSkillsByTrack] = useState({
    software: TRACKS.software.defaultSkills,
    data: TRACKS.data.defaultSkills,
    audio: TRACKS.audio.defaultSkills
  });

  const [resumeTextByTrack, setResumeTextByTrack] = useState({
    software: "",
    data: "",
    audio: ""
  });

  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");

  const [remoteJobs, setRemoteJobs] = useState([]);
  const [remoteWarnings, setRemoteWarnings] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [remoteSearched, setRemoteSearched] = useState(false);
  const [audioSearchRequested, setAudioSearchRequested] = useState(false);

  const [customMatch, setCustomMatch] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkillText, setRequiredSkillText] = useState("");
    const [sessionNotice, setSessionNotice] = useState("");

  const skillText = skillsByTrack[track];

    async function request(path, options = {}) {
    const isPrivate =
      path.startsWith("/api/saved-jobs") ||
      path.startsWith("/api/resume/") ||
      path === "/api/matches/custom";

    if (isPrivate && !auth?.token) {
      throw new Error("Sign in to use this feature.");
    } // end if no token

    try {
      return await apiRequest(path, options, isPrivate ? auth.token : null);
    } catch (error) {
      if (isPrivate && error.status === 401) {
        changeAuth(null, "Your session expired. Please sign in again.");
      } // end if expired
      throw error;
    } // end try/catch
  } // end request
  function post(path, body) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  useEffect(() => {
    if (page !== "saved" || !auth?.token) {
      setSavedJobs([]);
      setSavedJobsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSavedJobs() {
      setSavedJobsLoading(true);
      setWorkspaceError("");

      try {
        const data = await apiRequest(
          `/api/saved-jobs?track=${encodeURIComponent(track)}`,
          {},
          auth.token
        );

        if (!cancelled) {
          setSavedJobs(
            Array.isArray(data.savedJobs) ? data.savedJobs : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setSavedJobs([]);
          setWorkspaceError(error.message);
        }
      } finally {
        if (!cancelled) setSavedJobsLoading(false);
      }
    }

    void loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, [page, track, auth?.token]);

  function changeAuth(nextAuth) {
  setAuth(nextAuth);
  setSavedJobs([]);
  setWorkspaceError("");
  setFormError("");
  setResumeTextByTrack({ software: "", data: "", audio: "" });
  setPage("jobs");
}
  function changeTrack(nextTrack) {
    setTrack(nextTrack);
    setSavedJobs([]);
    setWorkspaceError("");
    setRemoteJobs([]);
    setRemoteWarnings([]);
    setRemoteError("");
    setRemoteSearched(false);
    setAudioSearchRequested(false);
    setCustomMatch(null);
    setFormError("");
  }

  async function loadRemoteJobs() {
    if (track === "audio") return;

    setRemoteLoading(true);
    setRemoteError("");
    setRemoteJobs([]);
    setRemoteWarnings([]);
    setRemoteSearched(false);

    try {
      const data = await request(
        `/api/discover/remote?track=${encodeURIComponent(track)}`
      );
      setRemoteJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setRemoteWarnings(
        Array.isArray(data.errors) ? data.errors : []
      );
    } catch (error) {
      setRemoteError(error.message);
    } finally {
      setRemoteLoading(false);
      setRemoteSearched(true);
    }
  }

  function findRealJobs(event) {
    event.preventDefault();

    if (track === "audio") {
      setAudioSearchRequested(true);
    } else {
      void loadRemoteJobs();
    }

    document.getElementById("job-results")?.scrollIntoView();
  }

  async function previewCustomJob(event) {
    event.preventDefault();

    const skills = parseSkills(skillText);
    const requiredSkills = parseSkills(requiredSkillText);

    if (!skills.length || !requiredSkills.length) {
      setFormError("Enter your skills and the job's required skills.");
      return;
    }

    setPreviewLoading(true);
    setFormError("");
    setCustomMatch(null);

    try {
      const data = await post("/api/matches/custom", {
        skills,
        title,
        company,
        description,
        requiredSkills
      });
      setCustomMatch(data.match);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveJob() {
    const requiredSkills = parseSkills(requiredSkillText);

    if (
      !title.trim() ||
      !company.trim() ||
      !description.trim() ||
      !requiredSkills.length
    ) {
      setFormError("Complete the pasted-job form before saving.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const data = await post("/api/saved-jobs", {
        track,
        title,
        company,
        description,
        requiredSkills
      });

      setSavedJobs((current) => [data.savedJob, ...current]);
      setCustomMatch(null);
      setTitle("");
      setCompany("");
      setDescription("");
      setRequiredSkillText("");
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveListing(job, listingTrack) {
  if (!job.url || !job.source || !job.id) {
    throw new Error("This listing is missing a source link.");
  }

  const data = await post("/api/saved-jobs/from-listing", {
    
    track: listingTrack,
    title: String(job.title || "").trim().slice(0, 150),
    company: String(job.company || "Company not listed")
      .trim()
      .slice(0, 150),
    description: descriptionText(job.description || "").slice(0, 10000),
    source: job.source,
    sourceJobId: String(job.id).slice(0, 200),
    url: job.url
  });
  

  if (listingTrack === track) {
    setSavedJobs((current) =>
      current.some((saved) => saved._id === data.savedJob._id)
        ? current
        : [data.savedJob, ...current]
    );
  }

  return data.savedJob;
}

  async function updateStatus(jobId, status) {
    setWorkspaceError("");

    try {
      const data = await request(
        `/api/saved-jobs/${encodeURIComponent(jobId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );

      setSavedJobs((current) =>
        current.map((job) =>
          job._id === jobId ? data.savedJob : job
        )
      );
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  if (!auth) {
    return (
            <LoginPage
        request={(path, options) => apiRequest(path, options)}
        onAuthenticated={changeAuth}
        notice={sessionNotice}
      />
    );
  }

  return (
    <main className="page">
      <h1 className="app-title">
        <BriefcaseBusiness size={42} aria-hidden="true" />
        Job Match Assistant
      </h1>
      <p>
        Find real listings, review requirements, and track jobs you
        save. Discovery results are not verified resume matches.
      </p>

      <nav aria-label="App views" className="page-nav">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id)}
            aria-current={page === id ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
        <button type="button" onClick={() => changeAuth(null)}>
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </nav>

      <p>Signed in as {auth.user.email}</p>

      <label htmlFor="career-track">Career track</label>
      <select
        id="career-track"
        value={track}
        onChange={(event) => changeTrack(event.target.value)}
      >
        {Object.entries(TRACKS).map(([id, option]) => (
          <option key={id} value={id}>
            {option.label}
          </option>
        ))}
      </select>

      {page === "jobs" && (
        <>
          <JobSearchForm
            track={track}
            skillText={skillText}
            loading={remoteLoading}
            onSkillChange={(text) =>
              setSkillsByTrack((current) => ({
                ...current,
                [track]: text
              }))
            }
            onSubmit={findRealJobs}
          />

          <section id="job-results" aria-label="Real job results">
            {track === "audio" ? (
              <>
                {audioSearchRequested && (
                  <p>Select an area and click Search audio jobs below.</p>
                )}
                <AudioJobs request={request} onSave={saveListing} />
              </>
            ) : (
              <RemoteJobs
                track={track}
                jobs={remoteJobs}
                warnings={remoteWarnings}
                loading={remoteLoading}
                error={remoteError}
                searched={remoteSearched}
                onSave={saveListing}
              />
            )}
          </section>
        </>
      )}

      {page === "preview" && (
        <section aria-label="Custom job preview">
          <h2>
            <ClipboardPaste size={22} aria-hidden="true" />
            Preview a pasted job
          </h2>
          <p>
  Found a job outside this app? Enter its title, company, description,
  and required skills below. The preview compares those required skills
  with your editable career-track skill list. The percentage is a
  screening estimate, not proof that you qualify. You can save the job
  afterward.
</p>

          <p>
            Enter required skills from the listing. This preview uses
            your editable skills, not verified resume evidence.
          </p>

          <form onSubmit={previewCustomJob}>
            <label htmlFor="job-title">Job title</label>
            <input
              id="job-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <label htmlFor="company">Company</label>
            <input
              id="company"
              required
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />

            <label htmlFor="description">Job description</label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <label htmlFor="required-skills">
              Required skills, separated by commas
            </label>
            <textarea
              id="required-skills"
              required
              rows={2}
              value={requiredSkillText}
              onChange={(event) =>
                setRequiredSkillText(event.target.value)
              }
            />

            <button type="submit" disabled={previewLoading}>
              {previewLoading ? "Checking..." : "Preview match"}
            </button>
          </form>

          {formError && (
            <p role="alert" className="error">
              {formError}
            </p>
          )}

          {customMatch && (
            <article className="job">
              <h3>
                {customMatch.title} · {customMatch.company}
              </h3>
              <p>
                {customMatch.score}% match against manually entered
                skills. This is a screening estimate, not proof of
                qualification.
              </p>
              <p>
                <strong>Missing:</strong>{" "}
                {customMatch.missingSkills.join(", ") || "None"}
              </p>
            </article>
          )}

          <button type="button" onClick={saveJob} disabled={saving}>
            {saving ? "Saving..." : "Save pasted job"}
          </button>
        </section>
      )}

      {page === "resume" && (
        <ResumeComparison
          key={track}
          trackId={track}
          trackLabel={TRACKS[track].label}
          request={request}
          resumeText={resumeTextByTrack[track]}
          onResumeTextChange={(text) =>
            setResumeTextByTrack((current) => ({
              ...current,
              [track]: text
            }))
          }
        />
      )}

      {page === "saved" && (
        <>
          {workspaceError && (
            <p role="alert" className="error">
              {workspaceError}
            </p>
          )}

          <section aria-label="Saved jobs">
            <h2>
              <Bookmark size={22} aria-hidden="true" />
              Saved jobs: {TRACKS[track].label}
            </h2>

            {savedJobsLoading && <p>Loading saved jobs...</p>}

            {!savedJobsLoading &&
              !workspaceError &&
              savedJobs.length === 0 && (
                <p>No jobs saved for this track yet.</p>
              )}

            {savedJobs.map((job) => (
              <article key={job._id} className="job">
                <h3>
                  {job.title} · {job.company}
                </h3>

                {job.description && (
                  <>
                    <p>
                      {descriptionText(job.description).slice(0, 180)}
                      {descriptionText(job.description).length > 180
                        ? "…"
                        : ""}
                    </p>
                    <details>
                      <summary>View job description</summary>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {descriptionText(job.description)}
                      </p>
                    </details>
                  </>
                )}

                <p>
                  <strong>Required:</strong>{" "}
                  {job.requiredSkills?.length
                    ? job.requiredSkills.join(", ")
                    : "Requirements not reviewed"}
                </p>

                <label htmlFor={`status-${job._id}`}>
                  Application status
                </label>
                <select
                  id={`status-${job._id}`}
                  value={job.status || "saved"}
                  onChange={(event) =>
                    updateStatus(job._id, event.target.value)
                  }
                >
                  {Object.entries(STATUS_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>

                {job.appliedAt && (
                  <p>
                    Marked applied on{" "}
                    {new Date(job.appliedAt).toLocaleDateString()}
                  </p>
                )}

                <ResumeJobCheck
                  job={job}
                  resumeText={resumeTextByTrack[track]}
                  skillText={skillText}
                  request={request}
                />

                {job.url && (
                  <p>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open application on{" "}
                      {job.source || "source site"}
                    </a>
                  </p>
                )}

                {job.status !== "applied" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateStatus(job._id, "applied")
                    }
                  >
                    Mark applied
                  </button>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

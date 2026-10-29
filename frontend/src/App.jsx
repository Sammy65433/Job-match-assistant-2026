import { useCallback, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";

import "./App.css";
import { TRACKS, parseSkills } from "./tracks.js";
import ResumeComparison from "./ResumeComparison.jsx";
import LoginPage from "./LoginPage.jsx";
import { apiRequest } from "./api.js";
import { descriptionText } from "./descriptionText.js";
import AppNav from "./components/AppNav.jsx";
import FindJobsView from "./components/FindJobsView.jsx";
import PreviewJobView from "./components/PreviewJobView.jsx";
import SavedJobsView from "./components/SavedJobsView.jsx";
import { useAppliedListings } from "./hooks/useAppliedListings.js";
import { useSavedJobs } from "./hooks/useSavedJobs.js";

const SESSION_EXPIRED_NOTICE =
  "Your session expired. Please sign in again.";

function defaultSkillsByTrack() {
  return {
    software: TRACKS.software.defaultSkills,
    data: TRACKS.data.defaultSkills,
    audio: TRACKS.audio.defaultSkills
  };
} // end defaultSkillsByTrack

function emptyResumeTextByTrack() {
  return { software: "", data: "", audio: "" };
} // end emptyResumeTextByTrack

export default function App() {
  const [page, setPage] = useState("jobs");
  const [track, setTrack] = useState("software");
  const [auth, setAuth] = useState(null);
  const [sessionNotice, setSessionNotice] = useState("");

  const [skillsByTrack, setSkillsByTrack] = useState(defaultSkillsByTrack);
  const [resumeTextByTrack, setResumeTextByTrack] = useState(
    emptyResumeTextByTrack
  );

  const [remoteJobs, setRemoteJobs] = useState([]);
  const [remoteWarnings, setRemoteWarnings] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [remoteSearched, setRemoteSearched] = useState(false);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState(null);
  const [remoteRefreshHours, setRemoteRefreshHours] = useState(null);

  const [mode, setMode] = useState("remote");
  const [area, setArea] = useState("newark");

  const [customMatch, setCustomMatch] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkillText, setRequiredSkillText] = useState("");

  const changeAuth = useCallback((nextAuth, notice = "") => {
    setAuth(nextAuth);
    setSessionNotice(notice);
    setFormError("");
    setResumeTextByTrack(emptyResumeTextByTrack());
    setSkillsByTrack(defaultSkillsByTrack());
    setCustomMatch(null);
    setTitle("");
    setCompany("");
    setDescription("");
    setRequiredSkillText("");
    setPage("jobs");
  }, []);

  const handleSessionExpired = useCallback(() => {
    changeAuth(null, SESSION_EXPIRED_NOTICE);
  }, [changeAuth]);

  const token = auth?.token ?? null;

  const {
    savedJobs,
    setSavedJobs,
    loading: savedJobsLoading,
    error: savedJobsError,
    setError: setSavedJobsError
  } = useSavedJobs({
    enabled: page === "saved",
    track,
    token,
    onSessionExpired: handleSessionExpired
  });

  const appliedListingIds = useAppliedListings({
    enabled: page === "jobs",
    track,
    token
  });

  const skillText = skillsByTrack[track];

  async function request(path, options = {}) {
    const isPrivate =
      path.startsWith("/api/saved-jobs") ||
      path.startsWith("/api/resume/") ||
      path === "/api/matches/custom";

    if (isPrivate && !token) {
      throw new Error("Sign in to use this feature.");
    } // end if no token

    try {
      return await apiRequest(path, options, isPrivate ? token : null);
    } catch (error) {
      if (isPrivate && error.status === 401) {
        changeAuth(null, SESSION_EXPIRED_NOTICE);
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

  function clearResults() {
    setRemoteJobs([]);
    setRemoteWarnings([]);
    setRemoteError("");
    setRemoteSearched(false);
    setRemoteUpdatedAt(null);
    setRemoteRefreshHours(null);
  } // end clearResults

  function changeTrack(nextTrack) {
    setTrack(nextTrack);
    setMode(TRACKS[nextTrack].modes[0]);
    clearResults();
  } // end changeTrack

  function changeMode(nextMode) {
    setMode(nextMode);
    clearResults();
  } // end changeMode

  function changeArea(nextArea) {
    setArea(nextArea);
    clearResults();
  } // end changeArea

  function jobsUrl() {
    const skills = encodeURIComponent(skillText);
    const where = `area=${encodeURIComponent(area)}`;
    const which = `track=${encodeURIComponent(track)}`;

    if (track === "audio") {
      return `/api/discover/audio?${where}&mode=${encodeURIComponent(mode)}&skills=${skills}`;
    } // end if audio

    if (mode === "hybrid") {
      return `/api/discover/hybrid?${which}&${where}&skills=${skills}`;
    } // end if hybrid

    return `/api/discover/remote?${which}&skills=${skills}`;
  } // end jobsUrl

  async function loadRemoteJobs() {
    setRemoteLoading(true);
    clearResults();

    try {
      const data = await request(jobsUrl());
      setRemoteJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setRemoteWarnings(Array.isArray(data.errors) ? data.errors : []);
      setRemoteUpdatedAt(data.updatedAt || null);
      setRemoteRefreshHours(
        typeof data.ttlHours === "number" ? data.ttlHours : null
      );
    } catch (error) {
      setRemoteError(error.message);
    } finally {
      setRemoteLoading(false);
      setRemoteSearched(true);
    }
  } // end loadRemoteJobs

  function findRealJobs(event) {
    event.preventDefault();
    void loadRemoteJobs();
    document.getElementById("job-results")?.scrollIntoView();
  } // end findRealJobs

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
  } // end previewCustomJob

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
  } // end saveJob

  async function saveListing(job, listingTrack) {
    if (!job.url || !job.source || !job.id) {
      throw new Error("This listing is missing a source link.");
    }

    const data = await post("/api/saved-jobs/from-listing", {
      track: listingTrack,
      title: String(job.title || "").trim().slice(0, 150),
      company: String(job.company || "Company not listed").trim().slice(0, 150),
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
  } // end saveListing

  async function updateStatus(jobId, status, interviewAt) {
    setSavedJobsError("");

    try {
      const data = await request(
        `/api/saved-jobs/${encodeURIComponent(jobId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...(interviewAt !== undefined ? { interviewAt } : {})
          })
        }
      );

      setSavedJobs((current) =>
        current.map((job) => (job._id === jobId ? data.savedJob : job))
      );
    } catch (error) {
      setSavedJobsError(error.message);
    }
  } // end updateStatus

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
        Find real listings, review requirements, and track jobs you save.
        Discovery results are not verified resume matches.
      </p>

      <AppNav
        page={page}
        onChangePage={setPage}
        onSignOut={() => changeAuth(null)}
      />

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
        <FindJobsView
          track={track}
          mode={mode}
          area={area}
          skillText={skillText}
          loading={remoteLoading}
          jobs={remoteJobs}
          warnings={remoteWarnings}
          error={remoteError}
          searched={remoteSearched}
          updatedAt={remoteUpdatedAt}
          refreshHours={remoteRefreshHours}
          appliedListingIds={appliedListingIds}
          onSkillChange={(text) =>
            setSkillsByTrack((current) => ({
              ...current,
              [track]: text
            }))
          }
          onModeChange={changeMode}
          onAreaChange={changeArea}
          onSubmit={findRealJobs}
          onSave={saveListing}
        />
      )}

      {page === "preview" && (
        <PreviewJobView
          title={title}
          company={company}
          description={description}
          requiredSkillText={requiredSkillText}
          previewLoading={previewLoading}
          saving={saving}
          formError={formError}
          customMatch={customMatch}
          onTitleChange={setTitle}
          onCompanyChange={setCompany}
          onDescriptionChange={setDescription}
          onRequiredSkillChange={setRequiredSkillText}
          onSubmit={previewCustomJob}
          onSave={saveJob}
        />
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
        <SavedJobsView
          track={track}
          savedJobs={savedJobs}
          loading={savedJobsLoading}
          error={savedJobsError}
          resumeText={resumeTextByTrack[track]}
          skillText={skillText}
          request={request}
          onStatusChange={updateStatus}
          onError={setSavedJobsError}
        />
      )}
    </main>
  );
}

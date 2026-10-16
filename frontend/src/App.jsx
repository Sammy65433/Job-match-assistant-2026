import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5003";

const TRACKS = {
  software: {
    label: "Software engineer",
    defaultSkills:
      "JavaScript, React, HTML, CSS, Git, Node.js, Express, MongoDB, SQL, Python, REST APIs"
  },
  data: {
    label: "Data analyst",
    defaultSkills:
      "Python, SQL, Excel, Tableau, Power BI, ETL, Data Analysis, Data Visualization, Data Modeling, SQLite"
  },
  audio: {
    label: "Audio engineer",
    defaultSkills:
      "Pro Tools, Logic Pro, Ableton Live, Audio Recording, Vocal Tracking, Audio Editing, Vocal Production, Microphone Placement, Signal Flow, Studio Sessions"
  }
};

const parseSkills = (text) =>
  text
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

function App() {
  const [track, setTrack] = useState("software");
  const [skillsByTrack, setSkillsByTrack] = useState({
    software: TRACKS.software.defaultSkills,
    data: TRACKS.data.defaultSkills,
    audio: TRACKS.audio.defaultSkills
  });
  const [remoteOnlyByTrack, setRemoteOnlyByTrack] = useState({
    software: true,
    data: true,
    audio: false
  });
  const [minimumSalaryByTrack, setMinimumSalaryByTrack] = useState({
    software: "",
    data: "",
    audio: ""
  });

  const [matches, setMatches] = useState([]);
  const [customMatch, setCustomMatch] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [remoteJobs, setRemoteJobs] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [remoteSearched, setRemoteSearched] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkillText, setRequiredSkillText] = useState("");

  const skillText = skillsByTrack[track];
  const remoteOnly = remoteOnlyByTrack[track];
  const minimumSalary = minimumSalaryByTrack[track];

  useEffect(() => {
    let cancelled = false;

    async function loadSavedJobs() {
      try {
        const response = await fetch(
          `${API_URL}/api/saved-jobs?track=${encodeURIComponent(track)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load saved jobs.");
        }

        if (!cancelled) {
          setSavedJobs(data.savedJobs);
        }
      } catch (err) {
        if (!cancelled) {
          setSavedJobs([]);
          setError(err.message);
        }
      }
    }

    loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, [track]);

  function changeTrack(nextTrack) {
  setTrack(nextTrack);
  setMatches([]);
  setCustomMatch(null);
  setSavedJobs([]);
  setRemoteJobs([]);
  setRemoteSearched(false);
  setRemoteError("");
  setHasSearched(false);
  setError("");
}

  async function request(path, options) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  const post = (path, body) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

  async function loadRemoteJobs() {
  if (track === "audio") return;

  setRemoteLoading(true);
  setRemoteError("");
  setRemoteJobs([]);
  setRemoteSearched(false);

  try {
    const data = await request(
      `/api/discover/remotive?track=${encodeURIComponent(track)}`
    );
    setRemoteJobs(Array.isArray(data.jobs) ? data.jobs : []);
  } catch (err) {
    setRemoteError(err.message);
  } finally {
    setRemoteLoading(false);
    setRemoteSearched(true);
  }
}

  async function findMatches(event) {
    event.preventDefault();

    const skills = parseSkills(skillText);

    if (!skills.length) {
      setError("Enter at least one skill.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await post("/api/matches", { skills });
      setMatches(data.matches);
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function previewCustomJob(event) {
    event.preventDefault();

    const skills = parseSkills(skillText);
    const requiredSkills = parseSkills(requiredSkillText);

    if (!skills.length || !requiredSkills.length) {
      setError("Enter your skills and the job's required skills.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await post("/api/matches/custom", {
        skills,
        title,
        company,
        description,
        requiredSkills
      });
      setCustomMatch(data.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveJob() {
    const requiredSkills = parseSkills(requiredSkillText);

    if (!title.trim() || !company.trim() || !description.trim() ||
      !requiredSkills.length) {
      setError("Complete the pasted-job form before saving.");
      return;
    }

    setSaving(true);
    setError("");

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
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const visibleMatches = matches.filter((job) => {
    if (remoteOnly && !job.remote) return false;
    if (
      minimumSalary !== "" &&
      (job.salaryMin == null || job.salaryMin < Number(minimumSalary))
    ) {
      return false;
    }
    return true;
  });

  const reviewQueue = visibleMatches.filter((job) => job.inReviewQueue);

  function renderJob(job) {
    return (
      <article key={job.id} className="job">
        <h3>{job.title} · {job.company}</h3>
        <p>
          <strong>{job.score}% skill match</strong> · {job.location}
          {job.salaryMin != null && (
            <>
              {" · "}Listed salary from{" "}
              {job.salaryMin.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
              })}
            </>
          )}
        </p>
        <p>{job.explanation}</p>
        <p>
          <strong>Matched:</strong>{" "}
          {job.matchedSkills.join(", ") || "None"}
        </p>
        <p>
          <strong>Missing:</strong>{" "}
          {job.missingSkills.join(", ") || "None"}
        </p>
        {job.inReviewQueue && (
          <span className="badge">Review queue</span>
        )}
      </article>
    );
  }

  return (
    <main className="page">
      <h1>Job Match Assistant</h1>
      <p>
        Compare skills with sample or pasted jobs. Scores are estimates,
        not proof of qualification.
      </p>

      <label htmlFor="career-track">Career track</label>
      <select
        id="career-track"
        value={track}
        onChange={(event) => changeTrack(event.target.value
          
        )}
      >
        {Object.entries(TRACKS).map(([id, option]) => (
          <option key={id} value={id}>{option.label}</option>
        ))}
      </select>

      <form onSubmit={findMatches}>
        <label htmlFor="skills">
          {TRACKS[track].label} skills, separated by commas
        </label>
        <textarea
          id="skills"
          rows={4}
          value={skillText}
          onChange={(event) =>
            setSkillsByTrack((current) => ({
              ...current,
              [track]: event.target.value
            }))
          }
        />

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) =>
              setRemoteOnlyByTrack((current) => ({
                ...current,
                [track]: event.target.checked
              }))
            }
          />
          Remote jobs only
        </label>

        <label htmlFor="minimum-salary">Minimum listed salary (USD)</label>
        <input
          id="minimum-salary"
          type="number"
          min="0"
          step="1000"
          value={minimumSalary}
          onChange={(event) =>
            setMinimumSalaryByTrack((current) => ({
              ...current,
              [track]: event.target.value
            }))
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Find sample matches"}
        </button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}

      {hasSearched && (
        <section aria-label="Sample job matches">
          <h2>Sample matches</h2>
          <p>
            {visibleMatches.length} shown · {reviewQueue.length} in review queue
          </p>
          {visibleMatches.length === 0 && (
            <p>No sample jobs meet these preferences.</p>
          )}
          {visibleMatches.map(renderJob)}
        </section>
      )}

      <section aria-label="Custom job preview">
        <h2>Preview a pasted job</h2>
        <p>
          Enter the required skills yourself. The description is for
          context only and is not automatically scored.
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
            onChange={(event) => setRequiredSkillText(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Preview match"}
          </button>
        </form>

        {customMatch && renderJob(customMatch)}

        <button
          type="button"
          onClick={saveJob}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save pasted job"}
        </button>
      </section>
      <section aria-label="Remote job listings">
        <h2>Remote jobs from Remotive</h2>
        <p>
          Live listings for exploration, not qualification matches. Open a
          listing on Remotive to review its full requirements and location
          restrictions.
        </p>

        {track === "audio" ? (
          <p>
            Remotive is a remote-job source and may not cover the local
            studio and audio roles you want. Pasted jobs remain available
            for this track.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={loadRemoteJobs}
              disabled={remoteLoading}
            >
              {remoteLoading ? "Loading..." : "Load remote jobs"}
            </button>

            {remoteError && <p role="alert" className="error">{remoteError}</p>}

            {remoteSearched && !remoteLoading && !remoteError && remoteJobs.length === 0 && (
              <p>No listings matched this track in the current Remotive results.</p>
            )}

            {remoteJobs.map((job) => (
              <article key={job.id} className="job">
                <h3>{job.title} · {job.company}</h3>
                <p>{job.location || "Location restrictions not specified"}</p>
                <p>
                  Source: Remotive ·{" "}
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    View job on Remotive
                  </a>
                </p>
              </article>
            ))}

          </>
        )}
      </section>


      <section aria-label="Saved jobs">
        <h2>Saved jobs: {TRACKS[track].label}</h2>
        {savedJobs.length === 0 && <p>No jobs saved for this track yet.</p>}

        {savedJobs.map((job) => {
          const skillMatch = parseSkills(skillText);
          const matched = job.requiredSkills.filter((required) =>
            skillMatch.some(
              (skill) => skill.toLowerCase() === required.toLowerCase()
            )
          );
          const score = Math.round(
            (matched.length / job.requiredSkills.length) * 100
          );

          return (
            <article key={job._id} className="job">
              <h3>{job.title} · {job.company}</h3>
              <p>
                <strong>{score}% skill match</strong>
                {score >= 60 && " · Review queue"}
              </p>
              <p>{job.description}</p>
              <p><strong>Required:</strong> {job.requiredSkills.join(", ")}</p>
              <p>
                <strong>Missing:</strong>{" "}
                {job.requiredSkills
                  .filter((required) => !matched.includes(required))
                  .join(", ") || "None"}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default App;

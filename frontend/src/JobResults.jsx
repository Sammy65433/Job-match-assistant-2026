import { Fragment } from "react";
import {
  BellRing,
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  SearchCheck
} from "lucide-react";
import SaveListingButton from "./SaveListingButton.jsx";
import { MATCH_ALERT_THRESHOLD, MODES } from "./tracks.js";

const LOCATION_LABELS = {
  "us-mentioned": "USA mentioned, eligibility unverified",
  "canada-mentioned": "Canada mentioned, US eligibility unverified",
  "verify-location": "Location eligibility needs review"
};

const SOURCE_URLS = {
  Remotive: "https://remotive.com",
  Jobicy: "https://jobicy.com",
  Himalayas: "https://himalayas.app",
  "The Muse": "https://www.themuse.com",
  Adzuna: "https://www.adzuna.com",
  Jooble: "https://jooble.org",
  Greenhouse: "https://www.greenhouse.com",
  Lever: "https://www.lever.co"
};

const AUDIO_GROUPS = [
  { id: "likely-related", title: "Likely related to audio production" },
  { id: "review", title: "Audio-related, review full listing" },
  { id: "other", title: "Other search results" }
];

function hasScore(job) {
  return typeof job.matchScore === "number";
} // end hasScore

function byScore(list) {
  return [...list].sort(
    (a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1)
  );
} // end byScore

function MatchLine({ job }) {
  if (!hasScore(job)) {
    return (
      <p>Match estimate: not enough skill keywords in the listing text.</p>
    );
  } // end if no score

  const strong = job.matchScore >= MATCH_ALERT_THRESHOLD;

  return (
    <>
      <p>
        {strong ? (
          <span className="badge">
            <BellRing size={14} aria-hidden="true" /> {job.matchScore}% skills
            match
          </span>
        ) : (
          <span>{job.matchScore}% skills match</span>
        )}
      </p>
      {job.missingSkills?.length > 0 && (
        <p>Listing mentions, not in your skills: {job.missingSkills.join(", ")}</p>
      )}
    </>
  );
} // end MatchLine

function JobCard({ job, track, onSave, appliedListingIds }) {
  const isApplied = appliedListingIds?.has(`${job.source}:${job.id}`) ?? false;

  return (
    <article className={`job${isApplied ? " job-applied" : ""}`}>
      {isApplied && (
        <p className="applied-badge">★ Applied, marked by me</p>
      )}

      <h3>
        <BriefcaseBusiness size={18} aria-hidden="true" />
        {job.title} · {job.company || "Company not listed"}
      </h3>

      <p>
        <MapPin size={16} aria-hidden="true" />
        {job.location || "Location not specified"}
      </p>

      {job.workMode && (
        <p>
          <strong>Work type:</strong> {MODES[job.workMode] || job.workMode}
        </p>
      )}

      {job.locationGroup && (
        <p>
          <MapPin size={16} aria-hidden="true" />
          <strong>Location check:</strong>{" "}
          {LOCATION_LABELS[job.locationGroup] || "Review full listing"}
        </p>
      )}

      {job.reason && <p>{job.reason}</p>}
      {job.relevance && job.description && <p>{job.description}</p>}

      <MatchLine job={job} />

      <p>
        Source: {job.source} ·{" "}
        <a href={job.url} target="_blank" rel="noopener noreferrer">
          View job on {job.source}
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </p>

      <SaveListingButton job={job} track={track} onSave={onSave} />
    </article>
  );
}

export default function JobResults({
  track,
  mode,
  jobs,
  warnings,
  loading,
  error,
  searched,
  onSave
}) {
  const strongMatches = byScore(
    jobs.filter(
      (job) => hasScore(job) && job.matchScore >= MATCH_ALERT_THRESHOLD
    )
  );

  const sections =
    track === "audio"
      ? AUDIO_GROUPS.map((group) => ({
          id: group.id,
          title: group.title,
          note: "",
          jobs: jobs.filter((job) => job.relevance === group.id)
        }))
      : [
          {
            id: "entry",
            title: "Explicitly entry-level titles",
            note: "These titles mention junior, entry-level, associate, graduate, or new grad. Check the full listing.",
            jobs: jobs.filter((job) => job.levelGroup === "explicit-entry-level")
          },
          {
            id: "unspecified",
            title: "Level unspecified",
            note: "These titles do not specify a level and may still require substantial experience.",
            jobs: jobs.filter((job) => job.levelGroup !== "explicit-entry-level")
          }
        ];

  return (
    <section aria-label="Job listings">
      <h2>
        <SearchCheck size={22} aria-hidden="true" />
        {MODES[mode]} jobs
      </h2>
      <p>
        Job-title and text screening only. The match percentage is the share
        of skills named in the listing text that are also in your skill list.
        Many sources show only a short preview, so it is an estimate, not
        proof you qualify. Open each listing to review requirements, location,
        and whether it is still available.
      </p>

      {loading && <p role="status">Loading jobs...</p>}

      {error && <p role="alert" className="error">{error}</p>}

      {warnings.length > 0 && (
        <p role="status">
          Some sources could not be loaded: {warnings.join(" · ")}
        </p>
      )}

      {strongMatches.length > 0 && (
        <p role="status">
          <BellRing size={16} aria-hidden="true" />
          {strongMatches.length} listing
          {strongMatches.length === 1 ? "" : "s"} at or above{" "}
          {MATCH_ALERT_THRESHOLD}% skills match. Top: {strongMatches[0].title}
          {" · "}
          {strongMatches[0].company || "Company not listed"} (
          {strongMatches[0].matchScore}%)
        </p>
      )}

      {searched && !loading && !error && jobs.length === 0 && (
        <p>No listings matched in the current results.</p>
      )}

      {sections.map(
        (section) =>
          section.jobs.length > 0 && (
            <Fragment key={section.id}>
              <h3 className="group-title">{section.title}</h3>
              {section.note && <p>{section.note}</p>}
              {byScore(section.jobs).map((job) => (
                <JobCard
  key={job.id}
  job={job}
  track={track}
  onSave={onSave}
  appliedListingIds={appliedListingIds}
/>

              ))}
            </Fragment>
          )
      )}

      {jobs.length > 0 && (
        <p>
          Sources:{" "}
          {[...new Set(jobs.map((job) => job.source))]
            .filter(Boolean)
            .map((source, index) => (
              <span key={source}>
                {index > 0 ? ", " : ""}
                {SOURCE_URLS[source] ? (
                  <a
                    href={SOURCE_URLS[source]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source}
                  </a>
                ) : (
                  source
                )}
              </span>
            ))}
          .
        </p>
      )}
    </section>
  );
} // end JobResults
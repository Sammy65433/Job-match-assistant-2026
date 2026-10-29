import { Bookmark } from "lucide-react";

import SavedJobCard from "./SavedJobCard.jsx";
import { TRACKS } from "../tracks.js";
import { formatInterviewDate, roundsForJob } from "../interviews.js";

function formatAppliedDate(value) {
  return new Date(value).toLocaleDateString([], { dateStyle: "medium" });
} // end formatAppliedDate

export default function SavedJobsView({
  track,
  savedJobs,
  loading,
  error,
  resumeText,
  skillText,
  request,
  onStatusChange,
  onInterviewsChange,
  onError
}) {
  const interviewItems = savedJobs
    .filter((job) => job.status === "interview")
    .flatMap((job) => roundsForJob(job).map((round) => ({ job, round })))
    .sort(
      (a, b) =>
        Date.parse(a.round.scheduledAt) - Date.parse(b.round.scheduledAt)
    );

  const appliedJobs = savedJobs
    .filter((job) => job.appliedAt)
    .sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt));

  const hasTracker = interviewItems.length > 0 || appliedJobs.length > 0;

  return (
    <>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <section aria-label="Saved jobs">
        <h2>
          <Bookmark size={22} aria-hidden="true" />
          Saved jobs: {TRACKS[track].label}
        </h2>

        {hasTracker && (
          <div className="tracker">
            {interviewItems.length > 0 && (
              <section className="tracker-group" aria-label="Interview schedule">
                <h3>Interview schedule</h3>
                <ul className="tracker-list">
                  {interviewItems.map(({ job, round }) => (
                    <li key={`${job._id}-${round._id}`}>
                      <a href={`#saved-job-${job._id}`}>
                        <span className="tracker-date">
                          {formatInterviewDate(round.scheduledAt)}
                        </span>
                        <span>
                          {round.round ? `${round.round} · ` : ""}
                          {job.title} · {job.company}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {appliedJobs.length > 0 && (
              <section className="tracker-group" aria-label="Applied jobs">
                <h3>Applied</h3>
                <ul className="tracker-list">
                  {appliedJobs.map((job) => (
                    <li key={job._id}>
                      <a href={`#saved-job-${job._id}`}>
                        <span className="tracker-date">
                          {formatAppliedDate(job.appliedAt)}
                        </span>
                        <span>
                          {job.title} · {job.company}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {loading && <p>Loading saved jobs...</p>}

        {!loading && !error && savedJobs.length === 0 && (
          <p>No jobs saved for this track yet.</p>
        )}

        {savedJobs.map((job) => (
          <SavedJobCard
            key={job._id}
            job={job}
            resumeText={resumeText}
            skillText={skillText}
            request={request}
            onStatusChange={onStatusChange}
            onInterviewsChange={onInterviewsChange}
            onError={onError}
          />
        ))}
      </section>
    </>
  );
}

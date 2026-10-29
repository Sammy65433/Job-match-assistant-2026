import InterviewRounds from "./InterviewRounds.jsx";
import ResumeJobCheck from "../ResumeJobCheck.jsx";
import { descriptionText } from "../descriptionText.js";
import { roundsForJob } from "../interviews.js";

const STATUS_LABELS = {
  saved: "Saved",
  ready: "Ready to apply",
  applied: "Applied (marked by me)",
  interview: "Interview",
  closed: "Closed",
  rejected: "Rejected"
};

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
} // end toDateInputValue

export default function SavedJobCard({
  job,
  resumeText,
  skillText,
  request,
  onStatusChange,
  onInterviewsChange,
  onError
}) {
  const text = descriptionText(job.description);
  const rounds = roundsForJob(job);

  return (
    <article className="job" id={`saved-job-${job._id}`}>
      <h3>
        {job.title} · {job.company}
      </h3>

      {job.description && (
        <>
          <p>
            {text.slice(0, 180)}
            {text.length > 180 ? "…" : ""}
          </p>
          <details>
            <summary>View job description</summary>
            <p style={{ whiteSpace: "pre-line" }}>{text}</p>
          </details>
        </>
      )}

      <p>
        <strong>Required:</strong>{" "}
        {job.requiredSkills?.length
          ? job.requiredSkills.join(", ")
          : "Requirements not reviewed"}
      </p>

      <fieldset>
        <legend>Application status</legend>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <label key={value} style={{ display: "block" }}>
            <input
              type="radio"
              name={`status-${job._id}`}
              value={value}
              checked={(job.status || "saved") === value}
              onChange={() => onStatusChange(job._id, value)}
            />{" "}
            {label}
          </label>
        ))}
      </fieldset>

      {(job.status === "interview" || rounds.length > 0) && (
        <InterviewRounds
          job={job}
          onChange={(interviews) =>
            onInterviewsChange(job._id, interviews)
          }
          onError={onError}
        />
      )}

      {job.status !== "saved" && job.status !== "ready" && (
        <>
          <label htmlFor={`applied-${job._id}`}>Date applied</label>
          <div className="interview-picker">
            <input
              id={`applied-${job._id}`}
              key={job.appliedAt || "no-applied-date"}
              type="date"
              defaultValue={toDateInputValue(job.appliedAt)}
            />
            <button
              type="button"
              onClick={() => {
                const value = document.getElementById(
                  `applied-${job._id}`
                )?.value;

                if (!value) {
                  onError("Choose the date you applied.");
                  return;
                }

                void onStatusChange(job._id, job.status, {
                  appliedAt: new Date(`${value}T00:00:00`).toISOString()
                });
              }}
            >
              Save applied date
            </button>
            <button
              type="button"
              onClick={() =>
                void onStatusChange(job._id, job.status, {
                  appliedAt: new Date().toISOString()
                })
              }
            >
              Today
            </button>
            {job.appliedAt && (
              <button
                type="button"
                onClick={() =>
                  void onStatusChange(job._id, job.status, {
                    appliedAt: null
                  })
                }
              >
                Clear date
              </button>
            )}
          </div>
        </>
      )}

      {job.appliedAt && (
        <p>
          Applied on{" "}
          {new Date(job.appliedAt).toLocaleDateString([], {
            dateStyle: "medium"
          })}
        </p>
      )}

      <ResumeJobCheck
        job={job}
        resumeText={resumeText}
        skillText={skillText}
        request={request}
      />

      {job.url && (
        <p>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            Open application on {job.source || "source site"}
          </a>
        </p>
      )}

      {job.status !== "applied" && (
        <button type="button" onClick={() => onStatusChange(job._id, "applied")}>
          Mark applied
        </button>
      )}
    </article>
  );
}

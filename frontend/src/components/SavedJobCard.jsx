import ResumeJobCheck from "../ResumeJobCheck.jsx";
import { descriptionText } from "../descriptionText.js";

const STATUS_LABELS = {
  saved: "Saved",
  ready: "Ready to apply",
  applied: "Applied (marked by me)",
  interview: "Interview",
  closed: "Closed",
  rejected: "Rejected"
};

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);
} // end toDateTimeLocalValue

export default function SavedJobCard({
  job,
  resumeText,
  skillText,
  request,
  onStatusChange,
  onError
}) {
  const text = descriptionText(job.description);

  return (
    <article className="job">
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

      {job.status === "interview" && (
        <>
          <label htmlFor={`interview-${job._id}`}>
            Interview date and time
          </label>
          <div className="interview-picker">
            <input
              id={`interview-${job._id}`}
              type="datetime-local"
              defaultValue={toDateTimeLocalValue(job.interviewAt)}
            />
            <button
              type="button"
              onClick={() =>
                document.getElementById(`interview-${job._id}`)?.showPicker()
              }
            >
              Choose date and time
            </button>
            <button
              type="button"
              onClick={() => {
                const value = document.getElementById(
                  `interview-${job._id}`
                )?.value;

                if (!value) {
                  onError("Choose a complete interview date and time.");
                  return;
                }

                void onStatusChange(
                  job._id,
                  "interview",
                  new Date(value).toISOString()
                );
              }}
            >
              Save interview date
            </button>
            {job.interviewAt && (
              <button
                type="button"
                onClick={() => {
                  void onStatusChange(job._id, "interview", null);
                }}
              >
                Remove interview date
              </button>
            )}
          </div>
        </>
      )}

      {job.interviewAt && (
        <p className="interview-confirmation" role="status">
          🎉 Interview scheduled for{" "}
          <strong>
            {new Date(job.interviewAt).toLocaleString([], {
              dateStyle: "full",
              timeStyle: "short"
            })}
          </strong>
        </p>
      )}

      {job.appliedAt && (
        <p>
          Marked applied on {new Date(job.appliedAt).toLocaleDateString()}
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

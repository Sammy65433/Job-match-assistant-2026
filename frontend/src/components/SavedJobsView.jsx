import { Bookmark } from "lucide-react";

import SavedJobCard from "./SavedJobCard.jsx";
import { TRACKS } from "../tracks.js";

export default function SavedJobsView({
  track,
  savedJobs,
  loading,
  error,
  resumeText,
  skillText,
  request,
  onStatusChange,
  onError
}) {
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
            onError={onError}
          />
        ))}
      </section>
    </>
  );
}

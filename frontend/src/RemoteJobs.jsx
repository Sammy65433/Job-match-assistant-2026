import {
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  SearchCheck
} from "lucide-react";
import SaveListingButton from "./SaveListingButton.jsx";

const LOCATION_LABELS = {
  "us-mentioned": "USA mentioned, eligibility unverified",
  "canada-mentioned": "Canada mentioned, US eligibility unverified",
  "verify-location": "Location eligibility needs review"
};

function JobCard({ job, track, onSave }) {
  return (
    <article className="job">
      <h3>
        <BriefcaseBusiness size={18} aria-hidden="true" />
        {job.title} · {job.company || "Company not listed"}
      </h3>

      <p>
        <MapPin size={16} aria-hidden="true" />
        {job.location || "Location restrictions not specified"}
      </p>

      {job.locationGroup && (
        <p>
          <MapPin size={16} aria-hidden="true" />
          <strong>Location check:</strong>{" "}
          {LOCATION_LABELS[job.locationGroup] || "Review full listing"}
        </p>
      )}

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

export default function RemoteJobs({
  track,
  jobs,
  warnings,
  loading,
  error,
  searched,
  onSave
}) {
  const entryLevelJobs = jobs.filter(
    (job) => job.levelGroup === "explicit-entry-level"
  );
  const unspecifiedJobs = jobs.filter(
    (job) => job.levelGroup !== "explicit-entry-level"
  );

  return (
    <section aria-label="Remote job listings">
      <h2>
        <SearchCheck size={22} aria-hidden="true" />
        Remote jobs
      </h2>
      <p>
        Job-title and location screening only. Open each listing on
        its source site to review experience requirements, location
        eligibility, and whether it is still available.
      </p>

      {track === "audio" ? (
        <p>
          Audio jobs use the separate Adzuna search. These results
          are for software and data only.
        </p>
      ) : (
        <>
          {loading && <p role="status">Loading remote jobs...</p>}

          {error && <p role="alert" className="error">{error}</p>}

          {warnings.length > 0 && (
            <p role="status">
              Some sources could not be loaded: {warnings.join(" · ")}
            </p>
          )}

          {searched && !loading && !error && jobs.length === 0 && (
            <p>No listings matched this track in the current results.</p>
          )}

          {entryLevelJobs.length > 0 && (
            <>
              <h3>Explicitly entry-level titles</h3>
              <p>
                These titles mention junior, entry-level, associate,
                graduate, or new grad. Check the full listing.
              </p>
              {entryLevelJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  track={track}
                  onSave={onSave}
                />
              ))}
            </>
          )}

          {unspecifiedJobs.length > 0 && (
            <>
              <h3>Level unspecified</h3>
              <p>
                These titles do not specify a level and may still
                require substantial experience.
              </p>
              {unspecifiedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  track={track}
                  onSave={onSave}
                />
              ))}
            </>
          )}

          {jobs.length > 0 && (
            <p>
              Sources:{" "}
              <a
                href="https://remotive.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Remotive
              </a>
              ,{" "}
              <a
                href="https://jobicy.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jobicy
              </a>
              , and{" "}
              <a
                href="https://himalayas.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Himalayas
              </a>
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

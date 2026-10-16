function JobCard({ job }) {
  return (
    <article className="job">
      <h3>
        {job.title} · {job.company || "Company not listed"}
      </h3>
      <p>{job.location || "Location restrictions not specified"}</p>
      <p>
        Source: {job.source} ·{" "}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View job on {job.source}
        </a>
      </p>
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
  onLoad
}) {
  const entryLevelJobs = jobs.filter(
    (job) => job.levelGroup === "explicit-entry-level"
  );
  const unspecifiedJobs = jobs.filter(
    (job) => job.levelGroup !== "explicit-entry-level"
  );

  return (
    <section aria-label="Remote job listings">
      <h2>Remote jobs</h2>
      <p>
        Job-title screening only. Open each listing on its source site
        to review experience requirements, location restrictions, and
        whether it is still available.
      </p>

      {track === "audio" ? (
        <p>
          Audio jobs use the separate Adzuna search. These remote-job
          results are for software and data only.
        </p>
      ) : (
        <>
          <button type="button" onClick={onLoad} disabled={loading}>
            {loading ? "Loading..." : "Load remote jobs"}
          </button>

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
                graduate, or new grad. Check the full listing before
                applying.
              </p>
              {entryLevelJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </>
          )}

          {unspecifiedJobs.length > 0 && (
            <>
              <h3>Level unspecified</h3>
              <p>
                These titles do not specify a level. They may still
                require substantial experience.
              </p>
              {unspecifiedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
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

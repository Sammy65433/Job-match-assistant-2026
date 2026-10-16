import { useState } from "react";

const AREAS = {
  los_angeles: "Los Angeles area",
  newark: "Newark / NYC area",
};

const GROUPS = [
  {
    id: "likely-related",
    title: "Likely related to audio production",
  },
  {
    id: "review",
    title: "Audio-related, review full listing",
  },
  {
    id: "other",
    title: "Other search results",
  },
];

export default function AudioJobs({ request }) {
  const [area, setArea] = useState("los_angeles");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  function changeArea(nextArea) {
    setArea(nextArea);
    setJobs([]);
    setSearched(false);
    setError("");
  }

  async function search() {
    setLoading(true);
    setSearched(false);
    setError("");
    setJobs([]);

    try {
      const data = await request(
        `/api/discover/audio?area=${encodeURIComponent(area)}`,
      );
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <section aria-label="Audio job listings">
      <h2>Audio jobs</h2>
      <p>
        Adzuna search candidates grouped by title and short preview, not by
        verified qualifications. Open each full listing before applying.
      </p>

      <label htmlFor="audio-area">Search area</label>
      <select
        id="audio-area"
        value={area}
        onChange={(event) => changeArea(event.target.value)}
      >
        {Object.entries(AREAS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button type="button" onClick={search} disabled={loading}>
        {loading ? "Searching..." : "Search audio jobs"}
      </button>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {searched && !loading && !error && jobs.length === 0 && (
        <p>No search results returned for this area.</p>
      )}

      {GROUPS.map((group) => {
        const groupJobs = jobs.filter((job) => job.relevance === group.id);

        if (groupJobs.length === 0) return null;

        return (
          <div key={group.id}>
            <h3>{group.title}</h3>

            {groupJobs.map((job) => (
              <article key={job.id} className="job">
                <h3>
                  {job.title} · {job.company || "Company not listed"}
                </h3>
                <p>{job.location || "Location not specified"}</p>
                <p>{job.reason}</p>
                <p>{job.description}</p>
                <p>
                  Source: Adzuna ·{" "}
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    View full job through Adzuna
                  </a>
                </p>
              </article>
            ))}
          </div>
        );
      })}
    </section>
  );
}

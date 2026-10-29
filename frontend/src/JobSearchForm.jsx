import { AREAS, MODES, TRACKS } from "./tracks.js";

export default function JobSearchForm({
  track,
  mode,
  area,
  skillText,
  loading,
  onSkillChange,
  onModeChange,
  onAreaChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="skills">
        {TRACKS[track].label} skills, separated by commas
      </label>
      <textarea
        id="skills"
        rows={4}
        value={skillText}
        onChange={(event) => onSkillChange(event.target.value)}
      />

      <label htmlFor="work-mode">Work type</label>
      <select
        id="work-mode"
        value={mode}
        onChange={(event) => onModeChange(event.target.value)}
      >
        {TRACKS[track].modes.map((value) => (
          <option key={value} value={value}>
            {MODES[value]}
          </option>
        ))}
      </select>

      {mode !== "remote" && (
        <>
          <label htmlFor="search-area">Search area</label>
          <select
            id="search-area"
            value={area}
            onChange={(event) => onAreaChange(event.target.value)}
          >
            {Object.entries(AREAS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </>
      )}

      <p>
        Your skills are used to estimate a 1.0–10.0 fit score on each
        listing and to compare saved jobs. They do not filter results.
        Salary filtering is not available for the current sources.
      </p>
      <button type="submit" disabled={loading}>
        {loading ? "Searching..." : "Find real jobs"}
      </button>
    </form>
  );
}
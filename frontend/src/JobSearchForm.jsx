import { TRACKS } from "./tracks.js";

export default function JobSearchForm({
  track,
  skillText,
  loading,
  onSkillChange,
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
      <p>
        These skills are used for saved-job comparisons, not to filter
        discovered listings yet. Salary filtering is not available for
        the current real-job sources.
      </p>
      <button type="submit" disabled={track !== "audio" && loading}>
        {track !== "audio" && loading ? "Searching..." : "Find real jobs"}
      </button>
    </form>
  );
}

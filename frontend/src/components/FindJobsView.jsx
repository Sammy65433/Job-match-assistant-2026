import JobResults from "../JobResults.jsx";
import JobSearchForm from "../JobSearchForm.jsx";

export default function FindJobsView({
  track,
  mode,
  area,
  skillText,
  loading,
  jobs,
  warnings,
  error,
  searched,
  updatedAt,
  appliedListingIds,
  onSkillChange,
  onModeChange,
  onAreaChange,
  onSubmit,
  onSave
}) {
  return (
    <>
      <JobSearchForm
        track={track}
        mode={mode}
        area={area}
        skillText={skillText}
        loading={loading}
        onSkillChange={onSkillChange}
        onModeChange={onModeChange}
        onAreaChange={onAreaChange}
        onSubmit={onSubmit}
      />

      <section id="job-results" aria-label="Real job results">
        <JobResults
          track={track}
          mode={mode}
          jobs={jobs}
          warnings={warnings}
          loading={loading}
          error={error}
          searched={searched}
          updatedAt={updatedAt}
          onSave={onSave}
          appliedListingIds={appliedListingIds}
        />
      </section>
    </>
  );
}

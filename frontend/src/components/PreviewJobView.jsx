import { ClipboardPaste } from "lucide-react";

export default function PreviewJobView({
  title,
  company,
  description,
  requiredSkillText,
  previewLoading,
  saving,
  formError,
  customMatch,
  onTitleChange,
  onCompanyChange,
  onDescriptionChange,
  onRequiredSkillChange,
  onSubmit,
  onSave
}) {
  return (
    <section aria-label="Custom job preview">
      <h2>
        <ClipboardPaste size={22} aria-hidden="true" />
        Preview a pasted job
      </h2>
      <p>
        Found a job outside this app? Enter its title, company, description,
        and required skills below. The preview compares those required skills
        with your editable career-track skill list. The percentage is a
        screening estimate, not proof that you qualify. You can save the job
        afterward.
      </p>

      <p>
        Enter required skills from the listing. This preview uses your editable
        skills, not verified resume evidence.
      </p>

      <form onSubmit={onSubmit}>
        <label htmlFor="job-title">Job title</label>
        <input
          id="job-title"
          required
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />

        <label htmlFor="company">Company</label>
        <input
          id="company"
          required
          value={company}
          onChange={(event) => onCompanyChange(event.target.value)}
        />

        <label htmlFor="description">Job description</label>
        <textarea
          id="description"
          required
          rows={5}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />

        <label htmlFor="required-skills">
          Required skills, separated by commas
        </label>
        <textarea
          id="required-skills"
          required
          rows={2}
          value={requiredSkillText}
          onChange={(event) => onRequiredSkillChange(event.target.value)}
        />

        <button type="submit" disabled={previewLoading}>
          {previewLoading ? "Checking..." : "Preview match"}
        </button>
      </form>

      {formError && (
        <p role="alert" className="error">
          {formError}
        </p>
      )}

      {customMatch && (
        <article className="job">
          <h3>
            {customMatch.title} · {customMatch.company}
          </h3>
          <p>
            {customMatch.score}% match against manually entered skills. This is
            a screening estimate, not proof of qualification.
          </p>
          <p>
            <strong>Missing:</strong>{" "}
            {customMatch.missingSkills.join(", ") || "None"}
          </p>
        </article>
      )}

      <button type="button" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save pasted job"}
      </button>
    </section>
  );
}

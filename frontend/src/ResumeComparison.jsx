import { useState } from "react";

const MAX_RESUME_LENGTH = 20000;
const MAX_REQUIREMENTS = 30;
const MAX_REQUIREMENT_LENGTH = 300;

const STARTER_TEXT = {
  software:
    "Built React interfaces and Express REST APIs using JavaScript, Node.js, MongoDB, HTML, CSS, and Git. Developed a MERN training tracker and a responsive business website.",
  data: "Built Python and SQL ETL pipelines, analyzed survey and staffing datasets, designed a SQLite star schema, and created reports and dashboards using Excel, Tableau, and Power BI.",
  audio:
    "Recorded and edited vocal sessions, set up microphones and signal flow, organized studio sessions, and contributed to vocal production. Used Pro Tools, Logic Pro, and Ableton Live.",
}; // end STARTER_TEXT

export default function ResumeComparison({
  trackId,
  trackLabel,
  request,
  resumeText,
  onResumeTextChange,
}) {
  const [requirementText, setRequirementText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requirements = requirementText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tooMany = requirements.length > MAX_REQUIREMENTS;
  const tooLong = requirements.some(
    (line) => line.length > MAX_REQUIREMENT_LENGTH,
  );

  function fillStarterText() {
    onResumeTextChange(STARTER_TEXT[trackId] || "");
    setResults(null);
    setError("");
  } // end fillStarterText

  async function compare(event) {
    event.preventDefault();

    if (!resumeText.trim() || requirements.length === 0) {
      setError("Add resume text and at least one job requirement.");
      return;
    } // end if missing input

    if (tooMany) {
      setError(`Use ${MAX_REQUIREMENTS} requirements or fewer.`);
      return;
    } // end if too many

    if (tooLong) {
      setError(
        `Keep each requirement under ${MAX_REQUIREMENT_LENGTH} characters.`,
      );
      return;
    } // end if too long

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await request("/api/resume/compare-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, requirements }),
      });
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    } // end try/catch/finally
  } // end compare

  function clearAll() {
    onResumeTextChange("");
    setRequirementText("");
    setResults(null);
    setError("");
  } // end clearAll

  return (
    <section aria-label="Resume comparison">
      <h2>Resume evidence check: {trackLabel}</h2>
      <p>
        Use an editable starter example or paste an anonymized resume. Enter
        requirements from the specific full job listing, one per line. Phrase
        matches are review hints, not proof you qualify.
      </p>
      <p>
        Text is sent to your local backend for these checks and is not saved. It
        stays in this page only until you click Clear or refresh. Keep personal
        contact details out of it.
      </p>

      <button type="button" onClick={fillStarterText}>
        Use {trackLabel} starter text
      </button>

      <form onSubmit={compare}>
        <label htmlFor="resume-text">Resume evidence text</label>
        <textarea
          id="resume-text"
          rows={8}
          maxLength={MAX_RESUME_LENGTH}
          value={resumeText}
          onChange={(event) => {
            onResumeTextChange(event.target.value);
            setResults(null);
          }}
        />

        <label htmlFor="requirement-text">
          Job requirements from the full listing, one per line
        </label>
        <textarea
          id="requirement-text"
          rows={5}
          value={requirementText}
          onChange={(event) => {
            setRequirementText(event.target.value);
            setResults(null);
          }}
        />

        <p>
          {requirements.length} requirement(s) entered
          {tooMany && ` (maximum ${MAX_REQUIREMENTS})`}
        </p>

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check resume for these phrases"}
        </button>
        <button type="button" onClick={clearAll}>
          Clear
        </button>
      </form>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {results && (
        <div>
          {results.requirements.map((item, index) => (
            <article key={`${item.requirement}-${index}`} className="job">
              <h3>{item.requirement}</h3>
              <p>
                <strong>
                  {item.exactPhraseFound
                    ? "Phrase found in resume"
                    : "Phrase not found"}
                </strong>
              </p>
              <p>{item.explanation}</p>
            </article>
          ))}
          <p>{results.note}</p>
        </div>
      )}
    </section>
  );
} // end ResumeComparison

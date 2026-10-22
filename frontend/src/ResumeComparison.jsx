import { useState } from "react";

const MAX_RESUME_LENGTH = 20000;
const MAX_JOB_LENGTH = 15000;
const MAX_REQUIREMENTS = 30;
const MAX_REQUIREMENT_LENGTH = 300;

const STARTER_TEXT = {
  software:
    "Built React interfaces and Express REST APIs using JavaScript, Node.js, MongoDB, HTML, CSS, and Git. Developed a MERN training tracker and a responsive business website.",
  data:
    "Built Python and SQL ETL pipelines, analyzed survey and staffing datasets, designed a SQLite star schema, and created reports and dashboards using Excel, Tableau, and Power BI.",
  audio:
    "Recorded and edited vocal sessions, set up microphones and signal flow, organized studio sessions, and contributed to vocal production. Used Pro Tools, Logic Pro, and Ableton Live."
};

export default function ResumeComparison({
  trackId,
  trackLabel,
  request,
  resumeText,
  onResumeTextChange
}) {
  const [requirementText, setRequirementText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [jobDescription, setJobDescription] = useState("");
  const [fullResult, setFullResult] = useState(null);
  const [fullLoading, setFullLoading] = useState(false);
  const [fullError, setFullError] = useState("");

  const requirements = requirementText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tooMany = requirements.length > MAX_REQUIREMENTS;
  const tooLong = requirements.some(
    (line) => line.length > MAX_REQUIREMENT_LENGTH
  );

  async function importResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setFullError("");
    setResults(null);
    setFullResult(null);

    try {
      if (file.size > 5_000_000) {
        throw new Error("Choose a file under 5 MB.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      let text = "";

      if (extension === "txt") {
        text = await file.text();
      } else if (extension === "docx") {
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer()
        });
        text = result.value;
      } else if (extension === "pdf") {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const pdf = await pdfjs.getDocument({
          data: new Uint8Array(await file.arrayBuffer())
        }).promise;

        const pages = [];
        for (let number = 1; number <= pdf.numPages; number++) {
          const page = await pdf.getPage(number);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => item.str || "").join(" "));
        }
        text = pages.join("\n");
      } else {
        throw new Error("Choose a .txt, .docx, or .pdf resume.");
      }

      text = text.trim();
      if (!text) {
        throw new Error("No selectable text found. Scanned PDFs need OCR.");
      }
      if (text.length > MAX_RESUME_LENGTH) {
        throw new Error(`Resume exceeds ${MAX_RESUME_LENGTH} characters.`);
      }

      onResumeTextChange(text);
    } catch (err) {
      setError(err.message || "Could not read the resume.");
    } finally {
      event.target.value = "";
    }
  }

  function fillStarterText() {
    onResumeTextChange(STARTER_TEXT[trackId] || "");
    setResults(null);
    setFullResult(null);
    setError("");
    setFullError("");
  }

  async function compare(event) {
    event.preventDefault();

    if (!resumeText.trim() || requirements.length === 0) {
      setError("Add resume text and at least one job requirement.");
      return;
    }
    if (tooMany) {
      setError(`Use ${MAX_REQUIREMENTS} requirements or fewer.`);
      return;
    }
    if (tooLong) {
      setError(
        `Keep each requirement under ${MAX_REQUIREMENT_LENGTH} characters.`
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await request("/api/resume/compare-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, requirements })
      });
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function compareFullDescription(event) {
    event.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setFullError("Add resume text and a full job description.");
      return;
    }

    setFullLoading(true);
    setFullError("");
    setFullResult(null);

    try {
      const data = await request("/api/resume/full-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          track: trackId
        })
      });
      setFullResult(data);
    } catch (err) {
      setFullError(err.message);
    } finally {
      setFullLoading(false);
    }
  }

  function clearAll() {
    onResumeTextChange("");
    setRequirementText("");
    setJobDescription("");
    setResults(null);
    setFullResult(null);
    setError("");
    setFullError("");
  }

  return (
    <section aria-label="Resume comparison">
      <h2>Resume evidence check: {trackLabel}</h2>
      <p>
        Import or paste resume text. Compare it with a full job description
        below, or check specific requirements one phrase per line. These are
        screening hints, not proof of qualification.
      </p>
      <p>
        Comparison sends text to your configured backend. It is not saved by
        these checks. Remove personal contact details before comparing if you
        do not want them sent.
      </p>

      <button type="button" onClick={fillStarterText}>
        Use {trackLabel} starter text
      </button>
      <label htmlFor="resume-file">Import resume (.txt, .docx, .pdf)</label>
      <input
        id="resume-file"
        type="file"
        accept=".txt,.docx,.pdf"
        onChange={importResume}
      />
      <label htmlFor="resume-text">Resume evidence text</label>
      <textarea
        id="resume-text"
        rows={8}
        maxLength={MAX_RESUME_LENGTH}
        value={resumeText}
        onChange={(event) => {
          onResumeTextChange(event.target.value);
          setResults(null);
          setFullResult(null);
        }}
      />

      <form onSubmit={compareFullDescription}>
        <label htmlFor="full-job-description">Full job description</label>
        <textarea
          id="full-job-description"
          rows={10}
          maxLength={MAX_JOB_LENGTH}
          value={jobDescription}
          onChange={(event) => {
            setJobDescription(event.target.value);
            setFullResult(null);
          }}
        />
        <button type="submit" disabled={fullLoading}>
          {fullLoading ? "Comparing..." : "Compare full description"}
        </button>
      </form>

      {fullError && (
        <p role="alert" className="error">
          {fullError}
        </p>
      )}
      {fullResult && (
        <div className="job" role="status">
          <h3>
            {fullResult.percentage === null
              ? "Not enough recognized keywords to calculate a percentage"
              : `${fullResult.percentage}% keyword overlap`}
          </h3>
          <p>
            Matched in resume: {fullResult.matched.join(", ") || "None"}
          </p>
          <p>
            Mentioned in listing, not found in resume:{" "}
            {fullResult.notFound.join(", ") || "None"}
          </p>
          <p>{fullResult.note}</p>
        </div>
      )}

      <form onSubmit={compare}>
        <label htmlFor="requirement-text">
          Specific job requirements, one per line
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
}

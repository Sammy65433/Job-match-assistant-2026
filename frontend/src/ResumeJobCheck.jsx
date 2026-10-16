import { useEffect, useState } from "react";
import { parseSkills } from "./tracks.js";

export default function ResumeJobCheck({
  job,
  resumeText,
  skillText,
  request,
}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);
    setError("");
  }, [resumeText, skillText]); // end useEffect

  async function compare() {
    if (!resumeText.trim()) {
      setError("Add resume evidence text before comparing a job.");
      return;
    } // end if no resume

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await request("/api/resume/keyword-overlap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle: job.title,
          jobDescription: job.description || "",
          keywords: [
            ...new Set([
              ...parseSkills(skillText),
              ...(job.requiredSkills || []),
            ]),
          ],
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    } // end try/catch/finally
  } // end compare

  return (
    <div>
      <button type="button" onClick={compare} disabled={loading}>
        {loading ? "Comparing..." : "Compare with my resume"}
      </button>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {result && (
        <div role="status">
          <p>
            <strong>{result.summary}</strong>
          </p>
          <p>
            Also in your resume text:{" "}
            {result.overlap.join(", ") || "None detected"}
          </p>
          <p>
            In the listing but not found in your resume text:{" "}
            {result.notInResume.join(", ") || "None"}
          </p>
          <p>{result.note}</p>
        </div>
      )}
    </div>
  );
} // end ResumeJobCheck

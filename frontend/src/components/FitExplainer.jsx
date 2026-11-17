import { useState } from "react";
import { Sparkles } from "lucide-react";

import { parseSkills } from "../tracks.js";

export default function FitExplainer({
  track,
  title,
  company,
  description,
  resumeText = "",
  skillText = "",
  matchScore = null,
  matchedSkills = [],
  missingSkills = [],
  request
}) {
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);
  const [loading, setLoading] = useState(false);

  const signature = [
    title,
    company,
    description,
    resumeText,
    skillText,
    matchScore
  ].join("|");

  const explanation =
    result && result.signature === signature ? result.explanation : "";
  const error =
    failure && failure.signature === signature ? failure.message : "";

  async function explain() {
    setLoading(true);
    setFailure(null);
    setResult(null);

    try {
      const data = await request("/api/fit-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          title,
          company: company || "Company not listed",
          description,
          resumeText,
          skills: parseSkills(skillText),
          matchScore,
          matchedSkills,
          missingSkills
        })
      });

      setResult({
        signature,
        explanation: data.explanation || ""
      });
    } catch (err) {
      setFailure({ signature, message: err.message });
    } finally {
      setLoading(false);
    }
  } // end explain

  return (
    <div className="fit-explainer">
      <button
        type="button"
        className="secondary"
        onClick={explain}
        disabled={loading}
      >
        <Sparkles size={16} aria-hidden="true" />
        {loading
          ? "Explaining..."
          : typeof matchScore === "number"
            ? "Explain this fit"
            : "Explain requirements match"}
      </button>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {explanation && (
        <div className="fit-explainer-result" role="status">
          <h4>Why this fit</h4>
          <p className="fit-explainer-text">{explanation}</p>
          <p className="fit-explainer-note">
            AI explanation based on the listing text and your profile. It is
            not a hiring prediction.
          </p>
        </div>
      )}
    </div>
  );
}

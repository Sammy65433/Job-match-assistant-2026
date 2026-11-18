import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, FileText, PenLine, Trash2 } from "lucide-react";

import { DEFAULT_PROFILE } from "../profileDefaults.js";
import { starterTextFor } from "../resumeStarters.js";

const MAX_COMPANY_LENGTH = 150;
const MAX_ROLE_LENGTH = 150;
const MAX_JOB_LENGTH = 15000;
const MAX_RESUME_LENGTH = 20000;
const MAX_LETTER_LENGTH = 12000;

const TONES = [
  ["professional", "Professional"],
  ["warm", "Warm"],
  ["concise", "Concise"],
  ["enthusiastic", "Enthusiastic"],
  ["direct", "Direct"]
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
} // end escapeHtml

function safeName(value) {
  return String(value || "cover-letter")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
} // end safeName

function contactHeader(profile) {
  return [
    profile.fullName,
    [profile.email, profile.phone].filter(Boolean).join(" · "),
    profile.location,
    profile.links
  ]
    .filter((line) => line && line.trim())
    .join("\n");
} // end contactHeader

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString([], { dateStyle: "medium" });
} // end formatDate

export default function CoverLetterView({
  track,
  trackLabel,
  request,
  resumeText,
  onResumeTextChange,
  prefill,
  onPrefillApplied,
  onUseForInterviews
}) {
  const [company, setCompany] = useState(() => prefill?.company || "");
  const [role, setRole] = useState(() => prefill?.role || "");
  const [jobDescription, setJobDescription] = useState(
    () => prefill?.jobDescription || ""
  );
  const [tone, setTone] = useState(() => prefill?.tone || "professional");
  const [profile, setProfile] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...(prefill?.profile || {})
  }));

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() =>
    prefill
      ? prefill.notice || "Company and job description filled from the saved job."
      : ""
  );

  const [draftId, setDraftId] = useState(() => prefill?.draftId || null);
  const [letter, setLetter] = useState(() => prefill?.letter || "");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [draftsState, setDraftsState] = useState({
    track: null,
    items: [],
    error: ""
  });

  const drafts = draftsState.track === track ? draftsState.items : [];
  const draftsLoading = draftsState.track !== track;
  const draftsError = draftsState.track === track ? draftsState.error : "";

  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }); // end keep request ref current

  useEffect(() => {
    if (prefill) onPrefillApplied?.();
  }, [prefill, onPrefillApplied]); // end clear consumed prefill

  useEffect(() => {
    let active = true;

    requestRef
      .current(`/api/cover-letters?track=${encodeURIComponent(track)}`)
      .then((data) => {
        if (!active) return;

        setDraftsState({
          track,
          items: Array.isArray(data.drafts) ? data.drafts : [],
          error: ""
        });
      })
      .catch((err) => {
        if (!active) return;

        setDraftsState({ track, items: [], error: err.message });
      });

    return () => {
      active = false;
    };
  }, [track]);

  const wordCount = useMemo(
    () => letter.split(/\s+/).filter(Boolean).length,
    [letter]
  );

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  } // end updateProfile

  function coverDraft() {
    return {
      company: company.trim(),
      role: role.trim(),
      jobDescription,
      resumeText,
      profile: { ...profile },
      tone,
      draftId,
      letter
    };
  } // end coverDraft

  function useForInterviews() {
    if (!company.trim()) {
      setError("Add a company name before opening interview prep.");
      return;
    } // end if missing company

    setError("");
    onUseForInterviews?.(coverDraft());
  } // end useForInterviews

  function resetForm() {
    setCompany("");
    setRole("");
    setJobDescription("");
    setTone("professional");
    setDraftId(null);
    setLetter("");
    setError("");
    setNotice("");
  } // end resetForm

  async function generate(event) {
    event.preventDefault();

    if (!company.trim() || !role.trim()) {
      setError("Add the company and the job title.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Paste the company or job description first.");
      return;
    }

    if (!resumeText.trim()) {
      setError("Add your background or resume text first.");
      return;
    }

    setGenerating(true);
    setError("");
    setNotice("");

    try {
      const data = await request("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          company,
          role,
          tone,
          jobDescription,
          resumeText,
          profile
        })
      });

      const draft = data.draft;
      setDraftId(draft._id);
      setLetter(draft.letter);
      setDraftsState((current) => ({
        track,
        items: [
          draft,
          ...current.items.filter((item) => item._id !== draft._id)
        ],
        error: ""
      }));
      setNotice("Cover letter generated and saved to your drafts.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  } // end generate

  async function saveEdits() {
    if (!draftId) {
      setError("Generate a letter before saving edits.");
      return;
    }

    if (!letter.trim()) {
      setError("The cover letter is empty.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const data = await request(
        `/api/cover-letters/${encodeURIComponent(draftId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ letter })
        }
      );

      setDraftsState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item._id === data.draft._id ? data.draft : item
        )
      }));
      setNotice("Changes saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  } // end saveEdits

  async function deleteDraft(id) {
    if (!window.confirm("Delete this cover letter draft?")) return;

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      await request(`/api/cover-letters/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      setDraftsState((current) => ({
        ...current,
        items: current.items.filter((item) => item._id !== id)
      }));

      if (draftId === id) {
        setDraftId(null);
        setLetter("");
      }

      setNotice("Draft deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  } // end deleteDraft

  function openDraft(draft) {
    setDraftId(draft._id);
    setCompany(draft.company || "");
    setRole(draft.role || "");
    setTone(draft.tone || "professional");
    setJobDescription(draft.jobDescription || "");
    setLetter(draft.letter || "");
    setError("");
    setNotice("");
  } // end openDraft

  function fullLetterText() {
    const header = contactHeader(profile);

    return header ? `${header}\n\n${letter}` : letter;
  } // end fullLetterText

  async function copyLetter() {
    setError("");
    setNotice("");

    try {
      await navigator.clipboard.writeText(fullLetterText());
      setNotice("Letter copied to the clipboard.");
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    }
  } // end copyLetter

  function downloadLetter() {
    const fileName = `Cover-Letter-${safeName(company)}-${safeName(role)}.txt`;
    const blob = new Blob([fullLetterText()], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("Letter downloaded.");
  } // end downloadLetter

  function printLetter() {
    const frame = document.createElement("iframe");

    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;

    if (!doc) {
      frame.remove();
      setError("Could not open the print view.");
      return;
    }

    const title = `${company} cover letter`;

    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
        title
      )}</title><style>
        body { margin: 0; padding: 48px; color: #111827; font-family: Georgia, "Times New Roman", serif; line-height: 1.6; }
        .header { margin-bottom: 28px; white-space: pre-line; }
        .letter { white-space: pre-wrap; }
        @page { margin: 20mm; }
      </style></head><body>
        <div class="header">${escapeHtml(contactHeader(profile))}</div>
        <div class="letter">${escapeHtml(letter)}</div>
      </body></html>`
    );
    doc.close();

    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => frame.remove(), 1000);
  } // end printLetter

  return (
    <section aria-label="Cover letter generator">
      <h2>
        <PenLine size={22} aria-hidden="true" />
        Cover letter: {trackLabel}
      </h2>
      <p>
        Paste the company and job information, add your background, and
        generate a tailored letter. Letters are saved to your account so you
        can edit and download them later.
      </p>
      <p>
        The letter only uses what you enter here. Check every claim before you
        send it. You can carry this company and job info into the Company
        &amp; interviews tab without retyping it.
      </p>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="cover-notice">
          {notice}
        </p>
      )}

      <form className="cover-form" onSubmit={generate}>
        <div className="cover-grid">
          <div>
            <label htmlFor="cover-company">Company</label>
            <input
              id="cover-company"
              type="text"
              maxLength={MAX_COMPANY_LENGTH}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company name"
            />
          </div>
          <div>
            <label htmlFor="cover-role">Job title</label>
            <input
              id="cover-role"
              type="text"
              maxLength={MAX_ROLE_LENGTH}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role you are applying for"
            />
          </div>
        </div>

        <label htmlFor="cover-job-info">Company / job description</label>
        <textarea
          id="cover-job-info"
          rows={10}
          maxLength={MAX_JOB_LENGTH}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job posting, company blurb, or both here."
        />

        <label htmlFor="cover-tone">Tone</label>
        <select
          id="cover-tone"
          value={tone}
          onChange={(event) => setTone(event.target.value)}
        >
          {TONES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="cover-background">Your background / resume text</label>
        <textarea
          id="cover-background"
          rows={8}
          maxLength={MAX_RESUME_LENGTH}
          value={resumeText}
          onChange={(event) => onResumeTextChange(event.target.value)}
          placeholder="Paste resume text or describe your relevant projects."
        />
        <div className="cover-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => onResumeTextChange(starterTextFor(track))}
          >
            Use {trackLabel} starter background
          </button>
          <button
            type="button"
            className="secondary"
            onClick={useForInterviews}
            disabled={!company.trim()}
          >
            <Building2 size={16} aria-hidden="true" />
            Use for interview prep
          </button>
        </div>

        <details className="cover-contact">
          <summary>Contact details used at the top of the letter</summary>
          <div className="cover-grid">
            <div>
              <label htmlFor="cover-name">Full name</label>
              <input
                id="cover-name"
                type="text"
                value={profile.fullName}
                onChange={(event) => updateProfile("fullName", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cover-email">Email</label>
              <input
                id="cover-email"
                type="email"
                value={profile.email}
                onChange={(event) => updateProfile("email", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cover-phone">Phone</label>
              <input
                id="cover-phone"
                type="text"
                value={profile.phone}
                onChange={(event) => updateProfile("phone", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cover-location">Location</label>
              <input
                id="cover-location"
                type="text"
                value={profile.location}
                onChange={(event) =>
                  updateProfile("location", event.target.value)
                }
              />
            </div>
          </div>
          <label htmlFor="cover-links">Links</label>
          <input
            id="cover-links"
            type="text"
            value={profile.links}
            onChange={(event) => updateProfile("links", event.target.value)}
          />
        </details>

        <div className="cover-actions">
          <button type="submit" disabled={generating}>
            {generating ? "Writing letter..." : "Generate cover letter"}
          </button>
          <button type="button" className="secondary" onClick={resetForm}>
            Start over
          </button>
        </div>
      </form>

      {letter && (
        <section className="cover-result" aria-label="Generated cover letter">
          <h2>Your draft</h2>
          <p>
            {wordCount} words
            {draftId ? " · saved to your drafts" : ""}
          </p>
          <label htmlFor="cover-letter-text">Edit your letter</label>
          <textarea
            id="cover-letter-text"
            className="cover-letter-text"
            rows={20}
            maxLength={MAX_LETTER_LENGTH}
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
          />
          <div className="cover-actions">
            <button
              type="button"
              onClick={saveEdits}
              disabled={saving || !draftId}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className="secondary" onClick={copyLetter}>
              <FileText size={18} aria-hidden="true" />
              Copy
            </button>
            <button type="button" className="secondary" onClick={downloadLetter}>
              Download .txt
            </button>
            <button type="button" className="secondary" onClick={printLetter}>
              Print / PDF
            </button>
            <button
              type="button"
              className="secondary"
              onClick={useForInterviews}
              disabled={!company.trim()}
            >
              <Building2 size={16} aria-hidden="true" />
              Interview prep
            </button>
          </div>
        </section>
      )}

      <section aria-label="Saved cover letter drafts">
        <h2>Saved drafts</h2>

        {draftsLoading && <p>Loading drafts...</p>}

        {draftsError && (
          <p role="alert" className="error">
            {draftsError}
          </p>
        )}

        {!draftsLoading && !draftsError && drafts.length === 0 && (
          <p>No cover letters saved for this track yet.</p>
        )}

        {drafts.length > 0 && (
          <ul className="cover-drafts">
            {drafts.map((draft) => (
              <li key={draft._id}>
                <button
                  type="button"
                  className="cover-draft-open"
                  onClick={() => openDraft(draft)}
                  aria-current={draftId === draft._id ? "true" : undefined}
                >
                  <strong>
                    {draft.role} · {draft.company}
                  </strong>
                  <span>
                    {formatDate(draft.updatedAt || draft.createdAt)} ·{" "}
                    {draft.tone}
                  </span>
                </button>
                <button
                  type="button"
                  className="secondary cover-draft-delete"
                  onClick={() => deleteDraft(draft._id)}
                  disabled={deletingId === draft._id}
                  aria-label={`Delete cover letter for ${draft.role} at ${draft.company}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

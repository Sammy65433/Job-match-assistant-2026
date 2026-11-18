import { useEffect, useRef, useState } from "react";
import { Building2, Copy, Download, PenLine, Printer, Trash2 } from "lucide-react";

import { DEFAULT_PROFILE } from "../profileDefaults.js";
import { starterTextFor } from "../resumeStarters.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
} // end escapeHtml

function safeName(value) {
  return (
    String(value || "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "company"
  );
} // end safeName

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString([], { dateStyle: "medium" });
} // end formatDate

function contactSummary(profile) {
  return [profile.fullName, profile.email, profile.location, profile.links]
    .filter((value) => value && value.trim())
    .join(" | ");
} // end contactSummary

export default function CompanyView({
  track,
  trackLabel,
  request,
  resumeText,
  onResumeTextChange,
  prefill,
  onPrefillApplied,
  onBackToCover
}) {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [company, setCompany] = useState(() => prefill?.company || "");
  const [website, setWebsite] = useState(() => prefill?.website || "");
  const [notes, setNotes] = useState(() => prefill?.notes || "");
  const [jobTitle, setJobTitle] = useState(() => prefill?.jobTitle || "");
  const [jobDescription, setJobDescription] = useState(
    () => prefill?.jobDescription || ""
  );
  const [profile, setProfile] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...(prefill?.profile || {})
  }));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [interview, setInterview] = useState(null);
  const [interviewQuestionsInput, setInterviewQuestionsInput] = useState("");
  const [interviewQuestionsInputKey, setInterviewQuestionsInputKey] =
    useState("");
  const [interviewAnswersInput, setInterviewAnswersInput] = useState([]);
  const [interviewAnswersInputKey, setInterviewAnswersInputKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => prefill?.notice || "");

  const requestRef = useRef(request);
  const prefillRef = useRef(prefill);

  const interviewQuestions = Array.isArray(interview?.questions)
    ? interview.questions
    : [];
  const interviewAnswers = Array.isArray(interview?.answers)
    ? interview.answers
    : [];
  const interviewQuestionsKey = interviewQuestions.join("\n");
  const savedAnswersByIndex = interviewQuestions.map((question, index) => {
    const saved =
      interviewAnswers.find((item) => item.question === question) ||
      interviewAnswers[index];

    return saved?.answer || "";
  });
  const interviewAnswersKey = JSON.stringify(savedAnswersByIndex);

  if (interviewQuestionsKey !== interviewQuestionsInputKey) {
    setInterviewQuestionsInputKey(interviewQuestionsKey);
    setInterviewQuestionsInput(interviewQuestionsKey);
  } // end sync editable question list

  if (interviewAnswersKey !== interviewAnswersInputKey) {
    setInterviewAnswersInputKey(interviewAnswersKey);
    setInterviewAnswersInput(savedAnswersByIndex);
  } // end sync editable answers

  useEffect(() => {
    requestRef.current = request;
  }); // end keep request ref current

  useEffect(() => {
    if (!prefill) return;

    prefillRef.current = prefill;
    onPrefillApplied?.();
  }, [prefill, onPrefillApplied]); // end consume prefill after keeping a copy

  useEffect(() => {
    let active = true;

    requestRef
      .current("/api/companies")
      .then((data) => {
        if (!active) return;

        const items = Array.isArray(data.profiles) ? data.profiles : [];
        setProfiles(items);

        const incoming = prefillRef.current;
        const name = String(incoming?.company || "")
          .trim()
          .toLowerCase();

        if (!name) return;

        const match = items.find(
          (item) =>
            String(item.company || "").trim().toLowerCase() === name
        ); // end find saved company

        if (!match) {
          setNotice(
            incoming.notice || "Company info carried over from your cover letter."
          );
          return;
        } // end if no saved match

        openProfile(match);

        if (!match.jobTitle && incoming.jobTitle) setJobTitle(incoming.jobTitle);

        if (!match.notes && (incoming.notes || incoming.jobDescription)) {
          setNotes(incoming.notes || incoming.jobDescription);
        } // end fill empty company notes

        if (!match.jobDescription && incoming.jobDescription) {
          setJobDescription(incoming.jobDescription);
        } // end fill empty job description

        setNotice(
          `Opened saved info for ${match.company}. Empty fields were filled from your cover letter.`
        );
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  function clearMessages() {
    setError("");
    setNotice("");
  } // end clearMessages

  function openProfile(item) {
    setSelectedId(item._id);
    setCompany(item.company || "");
    setWebsite(item.website || "");
    setNotes(item.notes || "");
    setJobTitle(item.jobTitle || "");
    setJobDescription(item.jobDescription || "");
    setAnswers(Array.isArray(item.answers) ? item.answers : []);
    setInterview(item.interview || null);
    setAnswer("");
    setQuestion("");
    clearMessages();
  } // end openProfile

  function newCompany() {
    setSelectedId(null);
    setCompany("");
    setWebsite("");
    setNotes("");
    setJobTitle("");
    setJobDescription("");
    setAnswers([]);
    setInterview(null);
    setAnswer("");
    setQuestion("");
    clearMessages();
  } // end newCompany

  function backToCover() {
    onBackToCover?.({
      company: company.trim(),
      role: jobTitle.trim(),
      jobDescription: jobDescription || notes,
      profile: { ...profile },
      notice: "Company info carried over from interview prep."
    });
  } // end backToCover

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  } // end updateProfile

  function payload() {
    return { company, website, notes, jobTitle, jobDescription };
  } // end payload

  async function persist() {
    const data = selectedId
      ? await requestRef.current(`/api/companies/${encodeURIComponent(selectedId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload())
        })
      : await requestRef.current("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload())
        });

    const saved = data.profile;

    setSelectedId(saved._id);
    setProfiles((current) => [saved, ...current.filter((item) => item._id !== saved._id)]);

    return saved;
  } // end persist

  async function saveCompany(event) {
    event.preventDefault();
    clearMessages();

    if (!company.trim()) {
      setError("Enter a company name first.");
      return;
    } // end if missing company

    setSaving(true);

    try {
      const saved = await persist();
      openProfile(saved);
      setNotice("Company info saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    } // end try/catch
  } // end saveCompany

  async function deleteCompany() {
    if (!selectedId) return;
    if (!window.confirm(`Delete the saved info for ${company}?`)) return;

    clearMessages();

    try {
      await requestRef.current(`/api/companies/${encodeURIComponent(selectedId)}`, {
        method: "DELETE"
      });
      setProfiles((current) => current.filter((item) => item._id !== selectedId));
      newCompany();
      setNotice("Company info deleted.");
    } catch (err) {
      setError(err.message);
    } // end try/catch
  } // end deleteCompany

  async function generateAnswer(event) {
    event.preventDefault();
    clearMessages();

    if (!question.trim()) {
      setError("Paste the application question first.");
      return;
    } // end if missing question

    setGeneratingAnswer(true);

    try {
      const saved = await persist();
      const data = await requestRef.current(
        `/api/companies/${encodeURIComponent(saved._id)}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, resumeText, profile })
        }
      );

      setAnswer(data.answer?.answer || "");
      setAnswers((current) => [data.answer, ...current]);
      setNotice("Answer generated and saved with this company.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingAnswer(false);
    } // end try/catch
  } // end generateAnswer

  async function generateInterview() {
    clearMessages();
    setGeneratingInterview(true);

    try {
      const saved = await persist();
      const data = await requestRef.current(
        `/api/companies/${encodeURIComponent(saved._id)}/interview-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, profile })
        }
      );

      setInterview(data.interview);
      setNotice("Interview questions generated. Writing answers...");

      try {
        const answerData = await requestRef.current(
          `/api/companies/${encodeURIComponent(saved._id)}/interview-answers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText, profile })
          }
        );

        setInterview(answerData.interview);
        setNotice("Interview questions and answers generated and saved.");
      } catch (answerErr) {
        setNotice("");
        setError(
          `Questions saved, but answers could not be generated. ${answerErr.message}`
        );
      } // end try/catch for answers
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingInterview(false);
    } // end try/catch
  } // end generateInterview

  async function generateAnswersOnly() {
    if (!selectedId) {
      setError("Generate interview questions first.");
      return;
    } // end if no saved profile

    clearMessages();
    setGeneratingInterview(true);

    try {
      const { id } = await persistQuestions();
      const data = await requestRef.current(
        `/api/companies/${encodeURIComponent(id)}/interview-answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, profile })
        }
      );

      setInterview(data.interview);
      setNotice("Interview answers generated and saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingInterview(false);
    } // end try/catch
  } // end generateAnswersOnly

  async function persistQuestions() {
    const questions = [];
    const answers = [];
    const seen = new Set();

    interviewQuestionsInput.split("\n").forEach((line, index) => {
      const question = line.trim().slice(0, 2000);

      if (question.length < 8 || seen.has(question)) return;
      if (questions.length >= 20) return;

      seen.add(question);
      questions.push(question);
      answers.push({
        question,
        answer: String(interviewAnswersInput[index] ?? "")
      });
    }); // match the backend's cleaned question list

    if (!questions.length) {
      throw new Error("Add at least one interview question first.");
    } // end if empty

    const saved = await persist();
    const data = await requestRef.current(
      `/api/companies/${encodeURIComponent(saved._id)}/interview`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers })
      }
    );

    setInterview(data.interview);
    return { id: saved._id, interview: data.interview };
  } // end persistQuestions

  async function saveQuestions() {
    clearMessages();

    try {
      await persistQuestions();
      setNotice("Questions and answers saved with this company.");
    } catch (err) {
      setError(err.message);
    } // end try/catch
  } // end saveQuestions

  async function deleteAnswer(answerId) {
    if (!selectedId) return;
    clearMessages();

    try {
      await requestRef.current(
        `/api/companies/${encodeURIComponent(selectedId)}/answers/${encodeURIComponent(answerId)}`,
        { method: "DELETE" }
      );
      setAnswers((current) => current.filter((item) => item._id !== answerId));
    } catch (err) {
      setError(err.message);
    } // end try/catch
  } // end deleteAnswer

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
      setError("");
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    } // end try/catch
  } // end copyText

  function printInterview() {
    const list = Array.isArray(interview?.questions) ? interview.questions : [];

    if (!list.length) {
      setError("Generate interview questions first.");
      return;
    } // end if empty

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
    } // end if no document

    const title = `${company || "Company"} interview Q&A`;
    const items = list
      .map((item, index) => {
        const answer = currentAnswerFor(index);

        return `<li><div class="question">${escapeHtml(item)}</div>${
          answer
            ? `<div class="answer">${escapeHtml(answer)}</div>`
            : ""
        }</li>`;
      })
      .join("");

    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
        title
      )}</title><style>
        body { margin: 0; padding: 40px; color: #111827; font-family: Georgia, "Times New Roman", serif; line-height: 1.6; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        p { color: #4b5563; font-size: 13px; margin: 0 0 24px; }
        ol { padding-left: 26px; }
        li { margin-bottom: 18px; page-break-inside: avoid; }
        .question { font-weight: bold; }
        .answer { margin-top: 8px; padding-left: 12px; border-left: 3px solid #d1d5db; color: #374151; white-space: pre-line; }
        @page { margin: 20mm; }
      </style></head><body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(contactSummary(profile))}</p>
        <ol>${items}</ol>
      </body></html>`
    );
    doc.close();

    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => frame.remove(), 1000);
  } // end printInterview

  function downloadInterview() {
    if (!interviewQuestions.length) {
      setError("Generate interview questions first.");
      return;
    } // end if empty

    const fileName = `Interview-QA-${safeName(company)}.txt`;
    const blob = new Blob([interviewText()], {
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
    setNotice("Interview Q&A downloaded.");
  } // end downloadInterview

  function currentAnswerFor(index) {
    return String(interviewAnswersInput[index] ?? "").trim();
  } // end currentAnswerFor

  function interviewText() {
    const lines = [
      `${company || "Company"} interview questions and answers`,
      contactSummary(profile),
      ""
    ];

    interviewQuestions.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
      const answer = currentAnswerFor(index);

      if (answer) lines.push(`Answer: ${answer}`);
      lines.push("");
    });

    return lines.join("\n").trim();
  } // end interviewText

  return (
    <section className="company-view" aria-label="Company research and interview prep">
      <h2>
        <Building2 size={22} aria-hidden="true" />
        Company &amp; interviews: {trackLabel}
      </h2>
      <p>
        Save what you know about a company, then generate answers to application
        questions and likely interview questions from that information. Company
        details from a cover letter can be carried into this tab, and you can
        return to the letter from here. The AI only uses what you enter — it
        does not look up the company or invent experience. Review every answer
        before sending it.
      </p>

      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="cover-notice">{notice}</p>}

      <form onSubmit={saveCompany}>
        <div className="company-heading">
          <h3>Saved companies</h3>
          <div className="cover-actions">
            <button type="button" className="secondary" onClick={backToCover}>
              <PenLine size={16} aria-hidden="true" />
              Back to cover letter
            </button>
            <button type="button" className="secondary" onClick={newCompany}>
              New company
            </button>
          </div>
        </div>

        {profiles.length > 0 && (
          <ul className="company-list">
            {profiles.map((item) => (
              <li key={item._id}>
                <button
                  type="button"
                  className="cover-draft-open"
                  aria-current={item._id === selectedId ? "true" : undefined}
                  onClick={() => openProfile(item)}
                >
                  <strong>{item.company}</strong>
                  <span>
                    {item.jobTitle || "No role saved"} · Updated{" "}
                    {formatDate(item.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="cover-grid">
          <div>
            <label htmlFor="company-name">Company name</label>
            <input
              id="company-name"
              type="text"
              maxLength={150}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="e.g. Jump"
            />
          </div>
          <div>
            <label htmlFor="company-website">Website (optional)</label>
            <input
              id="company-website"
              type="text"
              maxLength={300}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
        </div>

        <label htmlFor="company-role">Job title</label>
        <input
          id="company-role"
          type="text"
          maxLength={150}
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
        />

        <label htmlFor="company-notes">Company info / research notes</label>
        <textarea
          id="company-notes"
          rows={5}
          maxLength={15000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Mission, values, products, teams, recent news — paste what you found."
        />

        <label htmlFor="company-job">Job description (optional)</label>
        <textarea
          id="company-job"
          rows={5}
          maxLength={15000}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
        />

        <label htmlFor="company-background">Your background / resume text</label>
        <textarea
          id="company-background"
          rows={5}
          maxLength={20000}
          value={resumeText}
          onChange={(event) => onResumeTextChange(event.target.value)}
        />
        <button
          type="button"
          className="secondary"
          onClick={() => onResumeTextChange(starterTextFor(track))}
        >
          Use {trackLabel} starter background
        </button>

        <details className="cover-contact">
          <summary>Contact details used in answers</summary>
          <div className="cover-grid">
            {[
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["links", "Links"]
            ].map(([field, label]) => (
              <div key={field}>
                <label htmlFor={`company-profile-${field}`}>{label}</label>
                <input
                  id={`company-profile-${field}`}
                  type="text"
                  value={profile[field] || ""}
                  onChange={(event) => updateProfile(field, event.target.value)}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="cover-actions">
          <button type="submit" disabled={saving || generatingAnswer || generatingInterview}>
            {saving ? "Saving..." : "Save company info"}
          </button>
          {selectedId && (
            <button type="button" className="secondary" onClick={deleteCompany}>
              <Trash2 size={16} aria-hidden="true" /> Delete company
            </button>
          )}
        </div>
      </form>

      <form onSubmit={generateAnswer} className="company-section">
        <h3>Application questions</h3>
        <p>
          Paste a question such as “Why are you interested in this position?”
          The answer is saved under this company so you can reuse it.
        </p>

        <label htmlFor="company-question">Question</label>
        <textarea
          id="company-question"
          rows={3}
          maxLength={2000}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />

        <button
          type="submit"
          disabled={generatingAnswer || !question.trim() || !company.trim()}
        >
          {generatingAnswer ? "Writing answer..." : "Generate answer"}
        </button>

        {answer && (
          <>
            <label htmlFor="company-answer">Generated answer (editable)</label>
            <textarea
              id="company-answer"
              className="cover-letter-text"
              rows={8}
              maxLength={12000}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
            <button
              type="button"
              className="secondary"
              onClick={() => copyText(answer, "Answer copied to the clipboard.")}
            >
              <Copy size={16} aria-hidden="true" /> Copy answer
            </button>
          </>
        )}

        {answers.length > 0 && (
          <>
            <h4>Saved answers</h4>
            <ul className="qa-list">
              {answers.map((item) => (
                <li key={item._id} className="qa-item">
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                  <div className="cover-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => copyText(item.answer, "Answer copied to the clipboard.")}
                    >
                      <Copy size={15} aria-hidden="true" /> Copy
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => deleteAnswer(item._id)}
                    >
                      <Trash2 size={15} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </form>

      <section className="company-section">
        <h3>Interview prep</h3>
        <p>
          Generates likely questions and practice answers from the company info,
          job description, and background above. Questions and answers are saved
          with this company so you can reopen them later. Treat them as practice
          prompts, not guaranteed questions.
        </p>

        <button
          type="button"
          onClick={generateInterview}
          disabled={generatingInterview || !company.trim()}
        >
          {generatingInterview
            ? "Generating questions and answers..."
            : "Generate questions & answers"}
        </button>

        {interviewQuestions.length > 0 && (
          <>
            <p className="fit-explainer-note">
              Saved with {company || "this company"}
              {interview?.generatedAt
                ? ` · Generated ${formatDate(interview.generatedAt)}`
                : " · Saved manually"}
              {interview?.model ? ` · Model: ${interview.model}` : ""}
            </p>

            <ol className="interview-list">
              {interviewQuestions.map((item, index) => (
                <li key={`${index}-${item}`}>
                  <div className="interview-question">{item}</div>
                  <div className="interview-answer">
                    <label htmlFor={`interview-answer-${index}`}>
                      Answer for question {index + 1} (editable)
                    </label>
                    <textarea
                      id={`interview-answer-${index}`}
                      rows={6}
                      maxLength={12000}
                      placeholder="No answer yet — write one here or use Generate answers."
                      value={interviewAnswersInput[index] || ""}
                      onChange={(event) => {
                        setInterviewAnswersInput((current) => {
                          const next = [...current];
                          next[index] = event.target.value;
                          return next;
                        });
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>

            <div className="cover-actions">
              <button type="button" onClick={printInterview}>
                <Printer size={16} aria-hidden="true" /> Print / Save PDF
              </button>
              <button type="button" className="secondary" onClick={downloadInterview}>
                <Download size={16} aria-hidden="true" /> Download .txt
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  copyText(
                    interviewText(),
                    "Interview questions and answers copied to the clipboard."
                  )
                }
              >
                <Copy size={16} aria-hidden="true" /> Copy Q&amp;A
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  copyText(
                    interviewQuestions
                      .map((item, index) => `${index + 1}. ${item}`)
                      .join("\n"),
                    "Interview questions copied to the clipboard."
                  )
                }
              >
                <Copy size={16} aria-hidden="true" /> Copy questions
              </button>
              <button
                type="button"
                className="secondary"
                onClick={generateAnswersOnly}
                disabled={generatingInterview}
              >
                {generatingInterview
                  ? "Generating..."
                  : interviewAnswers.length
                    ? "Regenerate answers"
                    : "Generate answers"}
              </button>
            </div>

            <label htmlFor="interview-questions-edit">
              Edit or add questions (one per line)
            </label>
            <textarea
              id="interview-questions-edit"
              rows={8}
              value={interviewQuestionsInput}
              onChange={(event) => setInterviewQuestionsInput(event.target.value)}
            />
            <div className="cover-actions">
              <button
                type="button"
                className="secondary"
                onClick={saveQuestions}
                disabled={generatingInterview || !interviewQuestionsInput.trim()}
              >
                Save questions &amp; answers to this company
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}

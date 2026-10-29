import { useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";

import {
  formatInterviewDate,
  roundsForJob,
  stripRound
} from "../interviews.js";

const EMPTY_DRAFT = {
  scheduledAt: "",
  round: "",
  contact: "",
  location: "",
  notes: ""
};

export default function InterviewRounds({ job, onChange, onError }) {
  const rounds = roundsForJob(job);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  } // end updateDraft

  function addRound(event) {
    event.preventDefault();

    if (!draft.scheduledAt) {
      onError("Choose the interview date and time.");
      return;
    } // end if no date

    const next = [
      ...rounds.map(stripRound),
      {
        scheduledAt: new Date(draft.scheduledAt).toISOString(),
        round: draft.round.trim(),
        contact: draft.contact.trim(),
        location: draft.location.trim(),
        notes: draft.notes.trim()
      }
    ];

    onChange(next);
    setDraft(EMPTY_DRAFT);
  } // end addRound

  function removeRound(roundId) {
    onChange(
      rounds.filter((round) => round._id !== roundId).map(stripRound)
    );
  } // end removeRound

  return (
    <div className="interview-rounds">
      <h4>Interview rounds</h4>

      {rounds.length === 0 ? (
        <p>No interview rounds saved yet.</p>
      ) : (
        <ul className="round-list">
          {rounds.map((round) => (
            <li key={round._id} className="round-item">
              <div className="round-head">
                <strong>{round.round || "Interview"}</strong>
                <span>{formatInterviewDate(round.scheduledAt)}</span>
                <button
                  type="button"
                  className="round-remove"
                  onClick={() => removeRound(round._id)}
                >
                  <Trash2 size={14} aria-hidden="true" /> Remove
                </button>
              </div>
              {(round.contact || round.location) && (
                <p className="round-meta">
                  {[round.contact, round.location].filter(Boolean).join(" · ")}
                </p>
              )}
              {round.notes && <p className="round-notes">{round.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <details className="round-add">
        <summary>
          <CalendarPlus size={15} aria-hidden="true" /> Add interview round
        </summary>
        <form className="round-form" onSubmit={addRound}>
          <label htmlFor={`round-date-${job._id}`}>Date and time</label>
          <input
            id={`round-date-${job._id}`}
            type="datetime-local"
            required
            value={draft.scheduledAt}
            onChange={(event) => updateDraft("scheduledAt", event.target.value)}
          />

          <label htmlFor={`round-name-${job._id}`}>Round (optional)</label>
          <input
            id={`round-name-${job._id}`}
            placeholder="Phone screen, technical, final..."
            value={draft.round}
            onChange={(event) => updateDraft("round", event.target.value)}
          />

          <label htmlFor={`round-contact-${job._id}`}>
            Contact (optional)
          </label>
          <input
            id={`round-contact-${job._id}`}
            placeholder="Recruiter name or email"
            value={draft.contact}
            onChange={(event) => updateDraft("contact", event.target.value)}
          />

          <label htmlFor={`round-location-${job._id}`}>
            Location or meeting link (optional)
          </label>
          <input
            id={`round-location-${job._id}`}
            placeholder="Office, phone, or video link"
            value={draft.location}
            onChange={(event) => updateDraft("location", event.target.value)}
          />

          <label htmlFor={`round-notes-${job._id}`}>Notes (optional)</label>
          <textarea
            id={`round-notes-${job._id}`}
            rows={2}
            placeholder="Topics to prepare, questions to ask..."
            value={draft.notes}
            onChange={(event) => updateDraft("notes", event.target.value)}
          />

          <button type="submit">Save interview round</button>
        </form>
      </details>
    </div>
  );
}

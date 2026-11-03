import { useState } from "react";

export default function SaveListingButton({ job, track, onSave, onApply }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");

    try {
      await onSave(job, track);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function apply() {
    // Open immediately so the browser does not block the tab after an async save.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;

    setSaving(true);
    setError("");

    let targetUrl = job.url;

    try {
      await onSave(job, track);
      setSaved(true);

      if (onApply) {
        try {
          const result = await onApply(job, track);

          if (result?.url) {
            targetUrl = result.url;
          } // end if result url
        } catch {
          // Best effort: if the apply endpoint is unavailable, still open the
          // listing on its source site.
        } // end try/catch apply
      } // end if onApply

      if (tab) {
        tab.location.replace(targetUrl);
      } else {
        // Popup blocked: let the user open the listing with its existing link.
        setError("Saved. Open the listing using the View job link above.");
      }
    } catch (err) {
      if (tab) tab.close();
      setError(`Could not save the job: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={save} disabled={saving || saved}>
        {saving ? "Saving..." : saved ? "Saved" : "Save job"}
      </button>{" "}
      <button
        type="button"
        onClick={apply}
        disabled={saving || !job.url}
      >
        {saving ? "Saving..." : "Apply"}
      </button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}

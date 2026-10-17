import { useState } from "react";

export default function SaveListingButton({ job, track, onSave }) {
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

  return (
    <div>
      <button type="button" onClick={save} disabled={saving || saved}>
        {saving ? "Saving..." : saved ? "Saved" : "Save job"}
      </button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}

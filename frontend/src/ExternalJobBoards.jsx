import { useState } from "react";

import {
  buildExternalBoards,
  defaultExternalKeywords,
  externalLocation
} from "./externalBoards.js";

export default function ExternalJobBoards({ track, mode, area }) {
  const [keywords, setKeywords] = useState(() => defaultExternalKeywords(track));
  const [copied, setCopied] = useState(false);

  const suggestedKeywords = defaultExternalKeywords(track);
  const location = externalLocation(mode, area);
  const boards = buildExternalBoards({ keywords, location, mode });

  async function copySearchTerms() {
    try {
      await navigator.clipboard.writeText(`${keywords.trim()} — ${location}`);
      setCopied(true);
    } catch {
      setCopied(false);
    } // end try/catch
  } // end copySearchTerms

  return (
    <section className="external-boards" aria-labelledby="external-boards-title">
      <h2 id="external-boards-title" className="group-title">
        Search other job boards
      </h2>
      <p className="external-intro">
        These links open each board&apos;s own search in a new tab. Job Match
        Assistant does not import their listings, score them, or apply for you.
        Review the results and apply on the board&apos;s site.
      </p>

      <label htmlFor="external-keywords">Keywords for other boards</label>
      <div className="external-keywords-row">
        <input
          id="external-keywords"
          type="text"
          value={keywords}
          onChange={(event) => {
            setKeywords(event.target.value);
            setCopied(false);
          }}
          placeholder={suggestedKeywords}
        />
        <button type="button" onClick={() => setKeywords(suggestedKeywords)}>
          Use track default
        </button>
      </div>
      <p className="external-meta">
        Location sent to boards: <strong>{location}</strong>. Edit the keywords
        above to narrow or broaden each search.
      </p>

      <ul className="board-grid">
        {boards.map((board) => (
          <li key={board.id} className="board-card">
            <a
              className="board-link"
              href={board.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search {board.name} <span aria-hidden="true">↗</span>
            </a>
            {board.note && <p className="board-note">{board.note}</p>}
            {board.manual && (
              <button type="button" onClick={copySearchTerms}>
                {copied ? "Copied" : "Copy search terms"}
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="external-footnote">
        Boards that need an account will ask you to sign in on their own site.
        Jobs found here are not added to this app automatically — use{" "}
        <strong>Preview a pasted job</strong> to score and save one manually.
      </p>
    </section>
  );
}

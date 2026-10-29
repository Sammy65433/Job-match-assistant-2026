import {
  Bookmark,
  ClipboardPaste,
  FileCheck2,
  LogOut,
  Search
} from "lucide-react";

const TABS = [
  ["jobs", "Find jobs", Search],
  ["preview", "Preview a pasted job", ClipboardPaste],
  ["resume", "Resume evidence", FileCheck2],
  ["saved", "Saved jobs", Bookmark]
];

export default function AppNav({ page, onChangePage, onSignOut }) {
  return (
    <nav aria-label="App views" className="page-nav">
      {TABS.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChangePage(id)}
          aria-current={page === id ? "page" : undefined}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
      <button type="button" onClick={onSignOut}>
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </button>
    </nav>
  );
}

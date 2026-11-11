import { CACHE_TTL_MS } from "./config.js";
import { asHttpsUrl, repairText, stripHtml } from "./text.js";
import { isAiTitle } from "./titles.js";

const HIRING_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date";
const COMMENT_SEARCH_URL = "https://hn.algolia.com/api/v1/search";
const HIRING_QUERY = "who is hiring";
const THREADS_TO_SCAN = 3;
const COMMENTS_PER_THREAD = 50;

let cachedJobs = null;
let cachedAt = 0;
let pendingFetch = null;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
} // end cleanText

function applyLinkFromHtml(value) {
  const text = typeof value === "string" ? value : "";
  const match = /href="([^"]*)"/i.exec(text);
  const href = match?.[1] ?? "";

  const decoded = href
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");

  return /^https?:\/\//i.test(decoded) ? decoded : null;
} // end applyLinkFromHtml

const JOB_COMMENT = /^[A-Z][A-Za-z0-9&/ .()'-]*\|/;

function isJobComment(text) {
  const cleaned = cleanText(text).replace(/<[^>]*>/g, " ");
  const firstSegment = cleaned.split("|")[0] || "";

  return JOB_COMMENT.test(cleaned) && cleanText(firstSegment).length > 0;
} // end isJobComment

function toJob(comment, thread) {
  const description = stripHtml(comment.comment_text, 8000);
  const segments = description
    .split("|")
    .map((segment) => cleanText(segment))
    .filter(Boolean);
  const company = cleanText(segments[0]) || "Company not listed";
  const role = cleanText(segments[1]) || "Open role";
  const location =
    cleanText(segments.find((segment) => /remote|onsite|hybrid|in person/i.test(segment))) ||
    cleanText(segments[2]) ||
    "";
  const url =
    asHttpsUrl(applyLinkFromHtml(comment.comment_text)) ||
    asHttpsUrl(
      thread.storyId ? `https://news.ycombinator.com/item?id=${thread.storyId}` : null
    );

  if (!url) {
    return null;
  } // end if no url

  return {
    id: `hackernews-${comment.objectID}`,
    title: repairText(role) || "Open role",
    company: repairText(company),
    location: repairText(location),
    url,
    description: repairText(description),
    source: "Hacker News",
    postedAt: Number.isFinite(Number(comment.created_at_i))
      ? new Date(Number(comment.created_at_i) * 1000).toISOString()
      : null
  };
} // end toJob

async function fetchHiringThreads() {
  const url = new URL(HIRING_SEARCH_URL);
  url.searchParams.set("query", HIRING_QUERY);
  url.searchParams.set("tags", "ask_hn");
  url.searchParams.set("hitsPerPage", "20");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Hacker News returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const hits = Array.isArray(data?.hits) ? data.hits : [];

  return hits
    .filter((hit) => /who is hiring/i.test(hit.title || ""))
    .sort((a, b) => (b.created_at_i || 0) - (a.created_at_i || 0))
    .slice(0, THREADS_TO_SCAN)
    .map((hit) => ({ storyId: hit.story_id, url: hit.url }));
} // end fetchHiringThreads

async function fetchThreadComments(storyId) {
  const url = `${COMMENT_SEARCH_URL}?tags=comment&numericFilters=story_id=${storyId}&hitsPerPage=${COMMENTS_PER_THREAD}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Hacker News comments returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  return Array.isArray(data?.hits) ? data.hits : [];
} // end fetchThreadComments

export async function getHackerNewsJobs() {
  if (cachedJobs && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedJobs;
  } // end if fresh

  if (!pendingFetch) {
    pendingFetch = (async () => {
      const threads = await fetchHiringThreads();
      const jobs = [];

      for (const thread of threads) {
        const comments = await fetchThreadComments(thread.storyId);

        for (const comment of comments) {
          const hasText = Boolean(comment?.comment_text);
          const isJob = hasText && isJobComment(comment.comment_text);

          if (!hasText || !isJob) {
            continue;
          } // end if valid job comment

          const job = toJob(comment, thread);

          if (job) {
            jobs.push(job);
          } // end if mapped
        }
      } // end for comments

      cachedJobs = jobs;
      cachedAt = Date.now();
      return jobs;
    })().finally(() => {
      pendingFetch = null;
    });
  } // end if no pending

  return pendingFetch;
} // end getHackerNewsJobs

const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|tech lead|head of|director|manager|architect|vp|vice president|chief)\b/i;

const SOFTWARE_TITLE =
  /\b(software|developer|engineer|engineering|frontend|backend|full[\s-]?stack|web developer|react|vue|angular|node(?:\.js)?|typescript|javascript|python|java|c\+\+|golang|rust|devops|cloud|aws|azure|kubernetes|terraform)\b/i;

const DATA_TITLE =
  /\b(data|analyst|analytics|etl|scientist|machine learning|insights|reporting)\b/i;

export function selectHackerNewsJobs(jobs, track, limit = 100) {
  const titlePattern =
    track === "data" ? DATA_TITLE : track === "ai" ? null : SOFTWARE_TITLE;

  return jobs
    .filter((job) => !SENIOR_TITLE.test(job.title))
    .filter((job) =>
      track === "ai" ? isAiTitle(job.title) : titlePattern.test(job.title)
    )
    .slice(0, limit);
}

const MAX_DESCRIPTION_LENGTH = 10000;

const ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'"
};

export function stripHtml(value, maxLength = MAX_DESCRIPTION_LENGTH) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(nbsp|amp|lt|gt|quot|#39|apos);/gi,
      (entity) => ENTITIES[entity.toLowerCase()] ?? " "
    )
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/gi, (_m, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
} // end stripHtml

const MOJIBAKE = [
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€œ", "“"],
  ["â€\u009d", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€¦", "…"],
  ["â€¢", "•"],
  ["Â ", " "]
];

// Some sources send UTF-8 text that was already decoded as Windows-1252.
// Repair the common cases so titles and locations stay readable.
export function repairText(value) {
  if (typeof value !== "string" || !value) return "";

  let text = value;

  for (const [broken, fixed] of MOJIBAKE) {
    if (text.includes(broken)) text = text.split(broken).join(fixed);
  } // end for known artifacts

  if (/[ÃÂâ]/.test(text)) {
    const decoded = Buffer.from(text, "latin1").toString("utf8");

    if (!decoded.includes("\uFFFD") && decoded !== text) {
      text = decoded;
    } // end if valid decode
  } // end if possible mojibake

  return text.trim();
} // end repairText

export function asHttpsUrl(value) {
  if (typeof value !== "string" || !/^https:\/\//i.test(value)) return null;

  try {
    const url = new URL(value);
    if (url.port === "443") url.port = "";
    return url.toString();
  } catch {
    return null;
  } // end try/catch
} // end asHttpsUrl

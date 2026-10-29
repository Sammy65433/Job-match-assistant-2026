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
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
} // end stripHtml

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

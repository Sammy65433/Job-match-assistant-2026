export function descriptionText(value) {
  if (typeof value !== "string") return "";

  const document = new DOMParser().parseFromString(value, "text/html");

  document
    .querySelectorAll("script, style, iframe, object, embed")
    .forEach((element) => element.remove());

  document
    .querySelectorAll("br")
    .forEach((element) => element.replaceWith("\n"));

  document
    .querySelectorAll("li")
    .forEach((element) => element.prepend("• "));

  document
    .querySelectorAll("p, div, li, h1, h2, h3, h4")
    .forEach((element) => element.append("\n"));

  return (document.body.textContent || "")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

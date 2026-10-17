// Fail closed until a real authentication provider is configured.
// Replace this with server-side verification of a job-app user's token.
// Never trust ownerId sent in a request body or query string.
export function requireJobUser(_req, res, _next) {
  return res.status(503).json({
    error: "Saved jobs are unavailable until authentication is configured."
  });
}

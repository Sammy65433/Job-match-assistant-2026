const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5003";

export async function apiRequest(path, options = {}, token = null) {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } // end if token

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  } // end try/catch

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  } // end try/catch

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  } // end if not ok

  return data ?? {};
} // end apiRequest
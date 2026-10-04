const BASE = import.meta.env.VITE_API_URL || "/api";
export function getToken() {
  return localStorage.getItem("cbt_token") || "";
}
export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  const next = { ...options, headers };
  if (next.body && typeof next.body !== "string") next.body = JSON.stringify(next.body);
  const res = await fetch(BASE + path, next);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
export function hyphenateKey(value) {
  const clean = String(value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16);
  return clean.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

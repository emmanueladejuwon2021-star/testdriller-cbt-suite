const API = "/api";

export function deviceId() {
  let id = localStorage.getItem("td-device");
  if (!id) {
    id = `dev-${crypto.randomUUID()}`;
    localStorage.setItem("td-device", id);
  }
  return id;
}

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const CACHE = "td-offline-v1";
export function cacheSession(session) {
  localStorage.setItem(`${CACHE}-${session.id}`, JSON.stringify(session));
}
export function readCachedSession(id) {
  const raw = localStorage.getItem(`${CACHE}-${id}`);
  return raw ? JSON.parse(raw) : null;
}

const API = "/api";

export function deviceId() {
  let id = localStorage.getItem("td_device");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("td_device", id);
  }
  return id;
}
export function getToken() { return localStorage.getItem("td_token"); }
export function setSession(token, user) {
  localStorage.setItem("td_token", token);
  localStorage.setItem("td_user", JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem("td_token");
  localStorage.removeItem("td_user");
}
export function cachedUser() {
  try { return JSON.parse(localStorage.getItem("td_user") || "null"); } catch { return null; }
}
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.code === "TOKEN_EXPIRED") {
    clearSession();
    window.location.href = "/login?expired=1";
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify({ ...body, deviceId: deviceId(), deviceLabel: navigator.userAgent.slice(0, 80) }) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify({ ...body, deviceId: deviceId(), deviceLabel: navigator.userAgent.slice(0, 80) }) }),
  activate: (key) => request("/auth/activate", { method: "POST", body: JSON.stringify({ key }) }),
  me: () => request("/auth/me"),
  unbind: (id) => request(`/auth/devices/${encodeURIComponent(id)}`, { method: "DELETE" }),
  subjects: () => request("/questions/subjects"),
  bank: (subjectId, topicId) => request(`/questions/bank?subjectId=${subjectId}${topicId ? `&topicId=${topicId}` : ""}`),
  startExam: (body) => request("/exams/start", { method: "POST", body: JSON.stringify(body) }),
  saveAnswer: (id, body) => request(`/exams/${id}/answer`, { method: "PUT", body: JSON.stringify(body) }),
  submitExam: (id) => request(`/exams/${id}/submit`, { method: "POST", body: JSON.stringify({}) }),
  getExam: (id) => request(`/exams/${id}`),
  analytics: () => request("/analytics/overview"),
};
const QUEUE = "td_offline_queue";
export function queueAnswer(payload) {
  const q = JSON.parse(localStorage.getItem(QUEUE) || "[]");
  q.push(payload);
  localStorage.setItem(QUEUE, JSON.stringify(q));
}
export async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE) || "[]");
  if (!q.length) return;
  const remain = [];
  for (const item of q) {
    try { await api.saveAnswer(item.sessionId, item.body); } catch { remain.push(item); }
  }
  localStorage.setItem(QUEUE, JSON.stringify(remain));
}
export function cacheExam(sessionId, payload) {
  localStorage.setItem(`td_exam_${sessionId}`, JSON.stringify(payload));
}
export function readCachedExam(sessionId) {
  try { return JSON.parse(localStorage.getItem(`td_exam_${sessionId}`) || "null"); } catch { return null; }
}

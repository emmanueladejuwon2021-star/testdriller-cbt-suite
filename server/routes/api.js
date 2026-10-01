const express = require("express");
const jwt = require("jsonwebtoken");
const { all, one, run } = require("../db/turso");
const { id, formatKey } = require("../utils/ids");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const router = express.Router();
const SECRET = process.env.JWT_SECRET || "dev-secret";
function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email, full_name: user.full_name }, SECRET, { expiresIn: "30d" });
}
router.get("/health", async (_req, res) => {
  const started = Date.now();
  try { await one("SELECT 1 AS ok"); res.json({ ok: true, db_ms: Date.now() - started }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post("/users/register", async (req, res) => {
  try {
    const { full_name, email, phone, state, target_exam } = req.body || {};
    if (!full_name) return res.status(400).json({ ok: false, error: "Full name is required." });
    const userId = id();
    await run("INSERT INTO users (id, full_name, email, phone, state, target_exam, activation_status) VALUES (?, ?, ?, ?, ?, ?, 'demo')", [userId, full_name, email || null, phone || null, state || null, target_exam || "JAMB"]);
    const user = await one("SELECT * FROM users WHERE id = ?", [userId]);
    res.json({ ok: true, user, token: tokenFor(user) });
  } catch (err) { res.status(400).json({ ok: false, error: err.message }); }
});
router.post("/users/login", async (req, res) => {
  const user = await one("SELECT * FROM users WHERE email = ?", [req.body && req.body.email]);
  if (!user) return res.status(404).json({ ok: false, error: "No account found for that email." });
  res.json({ ok: true, user, token: tokenFor(user) });
});
router.get("/users/me", requireAuth, async (req, res) => {
  res.json({ ok: true, user: await one("SELECT * FROM users WHERE id = ?", [req.user.id]) });
});
router.patch("/users/me", requireAuth, async (req, res) => {
  const { target_exam, state, full_name } = req.body || {};
  await run("UPDATE users SET target_exam = COALESCE(?, target_exam), state = COALESCE(?, state), full_name = COALESCE(?, full_name) WHERE id = ?", [target_exam || null, state || null, full_name || null, req.user.id]);
  res.json({ ok: true, user: await one("SELECT * FROM users WHERE id = ?", [req.user.id]) });
});
router.post("/activation/redeem", optionalAuth, async (req, res) => {
  const key_code = formatKey(req.body && req.body.key_code);
  const row = await one("SELECT * FROM activation_keys WHERE key_code = ?", [key_code]);
  if (!row) return res.status(404).json({ ok: false, error: "This product key was not found." });
  if (row.is_used) return res.status(409).json({ ok: false, error: "This product key is already in use." });
  let userId = req.user && req.user.id;
  if (!userId) {
    userId = id();
    await run("INSERT INTO users (id, full_name, activation_status, product_key) VALUES (?, 'Licensed Student', 'active', ?)", [userId, key_code]);
  }
  const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
  await run("UPDATE activation_keys SET is_used = 1, assigned_user_id = ?, activated_at = datetime('now'), device_fingerprint = ? WHERE id = ?", [userId, (req.body && req.body.device_fingerprint) || "unknown", row.id]);
  await run("UPDATE users SET product_key = ?, activation_status = 'active', expiry_date = ? WHERE id = ?", [key_code, expiry.toISOString(), userId]);
  const user = await one("SELECT * FROM users WHERE id = ?", [userId]);
  res.json({ ok: true, user, token: tokenFor(user) });
});
router.get("/subjects", async (_req, res) => res.json({ ok: true, subjects: await all("SELECT * FROM subjects ORDER BY name") }));
router.get("/topics", async (req, res) => {
  const rows = req.query.subject_id ? await all("SELECT * FROM topics WHERE subject_id = ?", [req.query.subject_id]) : await all("SELECT * FROM topics");
  res.json({ ok: true, topics: rows });
});
router.get("/questions", optionalAuth, async (req, res) => {
  const { subject_id, exam_type, limit } = req.query;
  const clauses = []; const args = [];
  if (subject_id) { clauses.push("subject_id = ?"); args.push(subject_id); }
  if (exam_type) { clauses.push("exam_type = ?"); args.push(exam_type); }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = await all("SELECT * FROM questions " + where + " LIMIT ?", [...args, Math.min(Number(limit) || 180, 180)]);
  const user = req.user && (await one("SELECT activation_status FROM users WHERE id = ?", [req.user.id]));
  const demo = !user || user.activation_status !== "active";
  res.json({ ok: true, demo, questions: demo ? rows.slice(0, Number(process.env.DEMO_QUESTION_CAP || 10)) : rows });
});
router.get("/passages/:id", async (req, res) => res.json({ ok: true, passage: await one("SELECT * FROM passages WHERE id = ?", [req.params.id]) }));
router.post("/attempts", requireAuth, async (req, res) => {
  const body = req.body || {}; const answers = Array.isArray(body.answers) ? body.answers : [];
  const score = answers.filter((a) => a.is_correct).length; const total = answers.length; const attemptId = id();
  await run("INSERT INTO test_attempts (id, user_id, exam_mode, exam_type, subjects_json, overall_score, total_possible, percentage, duration_allowed_seconds, time_spent_seconds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [attemptId, req.user.id, body.exam_mode || "Practice", body.exam_type || "JAMB", JSON.stringify(body.subjects || []), score, total, total ? (score / total) * 100 : 0, body.duration_allowed_seconds || 0, body.time_spent_seconds || 0, body.status || "Completed"]);
  for (const ans of answers) {
    await run("INSERT INTO test_answers_log (id, attempt_id, question_id, user_selected_option, correct_option, is_correct, time_spent_seconds, was_bookmarked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id(), attemptId, ans.question_id, ans.user_selected_option || null, ans.correct_option || null, ans.is_correct ? 1 : 0, ans.time_spent_seconds || 0, ans.was_bookmarked ? 1 : 0]);
  }
  res.json({ ok: true, attempt_id: attemptId, overall_score: score, total_possible: total, percentage: total ? (score / total) * 100 : 0 });
});
router.get("/attempts", requireAuth, async (req, res) => res.json({ ok: true, attempts: await all("SELECT * FROM test_attempts WHERE user_id = ? ORDER BY date_taken DESC LIMIT 50", [req.user.id]) }));
router.get("/attempts/:id", requireAuth, async (req, res) => {
  res.json({ ok: true, attempt: await one("SELECT * FROM test_attempts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]), answers: await all("SELECT * FROM test_answers_log WHERE attempt_id = ?", [req.params.id]) });
});
router.post("/bookmarks", requireAuth, async (req, res) => {
  const bid = id();
  await run("INSERT INTO bookmarks (id, user_id, question_id, note, subject_id) VALUES (?, ?, ?, ?, ?)", [bid, req.user.id, req.body.question_id, req.body.note || "", req.body.subject_id || null]);
  res.json({ ok: true, id: bid });
});
router.get("/bookmarks", requireAuth, async (req, res) => res.json({ ok: true, bookmarks: await all("SELECT * FROM bookmarks WHERE user_id = ?", [req.user.id]) }));
router.get("/literature/books", async (_req, res) => res.json({ ok: true, books: await all("SELECT * FROM literature_books ORDER BY title") }));
router.get("/literature/books/:id", async (req, res) => res.json({ ok: true, book: await one("SELECT * FROM literature_books WHERE id = ?", [req.params.id]), chapters: await all("SELECT * FROM literature_chapters WHERE book_id = ? ORDER BY chapter_number", [req.params.id]) }));
router.get("/institutions", async (req, res) => {
  const q = (req.query.q || "").trim();
  const rows = q ? await all("SELECT * FROM institution_cutoffs WHERE institution_name LIKE ? OR course_name LIKE ?", ["%" + q + "%", "%" + q + "%"]) : await all("SELECT * FROM institution_cutoffs ORDER BY institution_name LIMIT 100");
  res.json({ ok: true, institutions: rows });
});
router.post("/games/scores", requireAuth, async (req, res) => {
  await run("INSERT INTO game_scores (id, user_id, game_type, score, high_score, level_reached) VALUES (?, ?, ?, ?, ?, ?)", [id(), req.user.id, req.body.game_type, req.body.score || 0, req.body.high_score || 0, req.body.level_reached || 1]);
  res.json({ ok: true });
});
router.get("/videos", async (_req, res) => res.json({ ok: true, videos: await all("SELECT * FROM video_tutorials") }));
router.get("/flashcards", async (_req, res) => res.json({ ok: true, flashcards: await all("SELECT * FROM flashcards") }));
router.post("/sync", requireAuth, async (req, res) => {
  await run("INSERT INTO sync_logs (id, user_id, records_synced_count, sync_status) VALUES (?, ?, ?, 'ok')", [id(), req.user.id, Number((req.body && req.body.records_synced_count) || 0)]);
  res.json({ ok: true, last_synced_at: new Date().toISOString() });
});
router.get("/parent/summary", requireAuth, async (req, res) => {
  const user = await one("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (String(req.query.pin) !== String(user.parent_pin || process.env.PARENT_DEFAULT_PIN || "2468")) return res.status(403).json({ ok: false, error: "Wrong parent PIN." });
  res.json({ ok: true, student: { full_name: user.full_name, total_tests_taken: user.total_tests_taken, average_score: user.average_score, target_exam: user.target_exam }, attempts: await all("SELECT * FROM test_attempts WHERE user_id = ? ORDER BY date_taken DESC LIMIT 20", [req.user.id]) });
});
module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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
  try {
    await one("SELECT 1 AS ok");
    res.json({ ok: true, db_ms: Date.now() - started });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/users/register", async (req, res) => {
  try {
    const { full_name, email, password, phone, state, target_exam } = req.body || {};
    if (!full_name || !email || !password) {
      return res.status(400).json({ ok: false, error: "Full name, email, and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    }
    const existing = await one("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(409).json({ ok: false, error: "An account with that email already exists." });
    }
    const password_hash = await bcrypt.hash(String(password), 10);
    const userId = id();
    await run(
      "INSERT INTO users (id, full_name, email, phone, state, target_exam, activation_status, password_hash) VALUES (?, ?, ?, ?, ?, ?, 'demo', ?)",
      [userId, full_name, email, phone || null, state || null, target_exam || "JAMB", password_hash]
    );
    const user = await one("SELECT * FROM users WHERE id = ?", [userId]);
    delete user.password_hash;
    res.json({ ok: true, user, token: tokenFor(user) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required." });
    }
    const user = await one("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }
    const match = await bcrypt.compare(String(password), user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid email or password." });
    }
    delete user.password_hash;
    res.json({ ok: true, user, token: tokenFor(user) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/users/me", requireAuth, async (req, res) => {
  const user = await one("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (user) delete user.password_hash;
  res.json({ ok: true, user });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const { target_exam, state, full_name } = req.body || {};
  await run(
    "UPDATE users SET target_exam = COALESCE(?, target_exam), state = COALESCE(?, state), full_name = COALESCE(?, full_name) WHERE id = ?",
    [target_exam || null, state || null, full_name || null, req.user.id]
  );
  const user = await one("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (user) delete user.password_hash;
  res.json({ ok: true, user });
});

router.post("/activation/redeem", optionalAuth, async (req, res) => {
  try {
    const key_code = formatKey(req.body && req.body.key_code);
    const row = await one("SELECT * FROM activation_keys WHERE key_code = ?", [key_code]);
    if (!row) return res.status(404).json({ ok: false, error: "This product key was not found." });
    if (row.is_used) return res.status(409).json({ ok: false, error: "This product key is already in use." });
    let userId = req.user && req.user.id;
    if (!userId) {
      userId = id();
      await run(
        "INSERT INTO users (id, full_name, activation_status, product_key) VALUES (?, 'Licensed Student', 'active', ?)",
        [userId, key_code]
      );
    }
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    await run(
      "UPDATE activation_keys SET is_used = 1, assigned_user_id = ?, activated_at = datetime('now'), device_fingerprint = ? WHERE id = ?",
      [userId, (req.body && req.body.device_fingerprint) || "unknown", row.id]
    );
    await run(
      "UPDATE users SET product_key = ?, activation_status = 'active', expiry_date = ? WHERE id = ?",
      [key_code, expiry.toISOString(), userId]
    );
    const user = await one("SELECT * FROM users WHERE id = ?", [userId]);
    if (user) delete user.password_hash;
    res.json({ ok: true, user, token: tokenFor(user) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get("/subjects", async (_req, res) => res.json({ ok: true, subjects: await all("SELECT * FROM subjects ORDER BY name") }));

router.get("/topics", async (req, res) => {
  const rows = req.query.subject_id
    ? await all("SELECT * FROM topics WHERE subject_id = ?", [req.query.subject_id])
    : await all("SELECT * FROM topics");
  res.json({ ok: true, topics: rows });
});

router.get("/questions", optionalAuth, async (req, res) => {
  const { subject_id, exam_type, limit } = req.query;
  const clauses = [];
  const args = [];
  if (subject_id) {
    clauses.push("subject_id = ?");
    args.push(subject_id);
  }
  if (exam_type) {
    clauses.push("exam_type = ?");
    args.push(exam_type);
  }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const cap = Math.min(Number(limit) || 180, 180);
  const rows = await all("SELECT * FROM questions " + where + " LIMIT ?", [...args, cap]);
  const user = req.user && (await one("SELECT activation_status FROM users WHERE id = ?", [req.user.id]));
  const demo = !user || user.activation_status !== "active";
  const demoCap = Number(process.env.DEMO_QUESTION_CAP || 10);
  res.json({ ok: true, demo, questions: demo ? rows.slice(0, demoCap) : rows });
});

router.get("/passages/:id", async (req, res) => res.json({ ok: true, passage: await one("SELECT * FROM passages WHERE id = ?", [req.params.id]) }));

router.post("/attempts", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (!answers.length) {
      return res.status(400).json({ ok: false, error: "At least one answer is required." });
    }

    let score = 0;
    const verifiedAnswers = [];
    for (const ans of answers) {
      if (!ans.question_id) continue;
      const q = await one("SELECT correct_option FROM questions WHERE id = ?", [ans.question_id]);
      const isCorrect = q && String(ans.user_selected_option || "").toUpperCase() === String(q.correct_option || "").toUpperCase();
      if (isCorrect) score += 1;
      verifiedAnswers.push({
        ...ans,
        is_correct: isCorrect,
        correct_option: q ? q.correct_option : null,
      });
    }

    const total = verifiedAnswers.length;
    const attemptId = id();
    const percentage = total ? (score / total) * 100 : 0;

    await run(
      "INSERT INTO test_attempts (id, user_id, exam_mode, exam_type, subjects_json, overall_score, total_possible, percentage, duration_allowed_seconds, time_spent_seconds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        attemptId,
        req.user.id,
        body.exam_mode || "Practice",
        body.exam_type || "JAMB",
        JSON.stringify(body.subjects || []),
        score,
        total,
        percentage,
        body.duration_allowed_seconds || 0,
        body.time_spent_seconds || 0,
        body.status || "Completed",
      ]
    );

    for (const ans of verifiedAnswers) {
      await run(
        "INSERT INTO test_answers_log (id, attempt_id, question_id, user_selected_option, correct_option, is_correct, time_spent_seconds, was_bookmarked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id(),
          attemptId,
          ans.question_id,
          ans.user_selected_option || null,
          ans.correct_option || null,
          ans.is_correct ? 1 : 0,
          ans.time_spent_seconds || 0,
          ans.was_bookmarked ? 1 : 0,
        ]
      );
    }

    // Update user aggregate stats
    const stats = await one(
      "SELECT COUNT(*) AS cnt, AVG(percentage) AS avg FROM test_attempts WHERE user_id = ?",
      [req.user.id]
    );
    await run(
      "UPDATE users SET total_tests_taken = ?, average_score = ? WHERE id = ?",
      [stats.cnt || 0, stats.avg || 0, req.user.id]
    );

    res.json({
      ok: true,
      attempt_id: attemptId,
      overall_score: score,
      total_possible: total,
      percentage,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/attempts", requireAuth, async (req, res) =>
  res.json({ ok: true, attempts: await all("SELECT * FROM test_attempts WHERE user_id = ? ORDER BY date_taken DESC LIMIT 50", [req.user.id]) })
);

router.get("/attempts/:id", requireAuth, async (req, res) => {
  res.json({
    ok: true,
    attempt: await one("SELECT * FROM test_attempts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]),
    answers: await all("SELECT * FROM test_answers_log WHERE attempt_id = ?", [req.params.id]),
  });
});

router.post("/bookmarks", requireAuth, async (req, res) => {
  const bid = id();
  await run(
    "INSERT INTO bookmarks (id, user_id, question_id, note, subject_id) VALUES (?, ?, ?, ?, ?)",
    [bid, req.user.id, req.body.question_id, req.body.note || "", req.body.subject_id || null]
  );
  res.json({ ok: true, id: bid });
});

router.get("/bookmarks", requireAuth, async (req, res) =>
  res.json({ ok: true, bookmarks: await all("SELECT * FROM bookmarks WHERE user_id = ?", [req.user.id]) })
);

router.get("/literature/books", async (_req, res) => res.json({ ok: true, books: await all("SELECT * FROM literature_books ORDER BY title") }));

router.get("/literature/books/:id", async (req, res) =>
  res.json({
    ok: true,
    book: await one("SELECT * FROM literature_books WHERE id = ?", [req.params.id]),
    chapters: await all("SELECT * FROM literature_chapters WHERE book_id = ? ORDER BY chapter_number", [req.params.id]),
  })
);

router.get("/institutions", async (req, res) => {
  const q = (req.query.q || "").trim();
  const rows = q
    ? await all("SELECT * FROM institution_cutoffs WHERE institution_name LIKE ? OR course_name LIKE ?", ["%" + q + "%", "%" + q + "%"])
    : await all("SELECT * FROM institution_cutoffs ORDER BY institution_name LIMIT 100");
  res.json({ ok: true, institutions: rows });
});

router.post("/games/scores", requireAuth, async (req, res) => {
  await run(
    "INSERT INTO game_scores (id, user_id, game_type, score, high_score, level_reached) VALUES (?, ?, ?, ?, ?, ?)",
    [id(), req.user.id, req.body.game_type, req.body.score || 0, req.body.high_score || 0, req.body.level_reached || 1]
  );
  res.json({ ok: true });
});

router.get("/videos", async (_req, res) => res.json({ ok: true, videos: await all("SELECT * FROM video_tutorials") }));

router.get("/flashcards", async (_req, res) => res.json({ ok: true, flashcards: await all("SELECT * FROM flashcards") }));

router.post("/sync", requireAuth, async (req, res) => {
  await run(
    "INSERT INTO sync_logs (id, user_id, records_synced_count, sync_status) VALUES (?, ?, ?, 'ok')",
    [id(), req.user.id, Number((req.body && req.body.records_synced_count) || 0)]
  );
  res.json({ ok: true, last_synced_at: new Date().toISOString() });
});

router.get("/parent/summary", requireAuth, async (req, res) => {
  const user = await one("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (String(req.query.pin) !== String(user.parent_pin || process.env.PARENT_DEFAULT_PIN || "2468")) {
    return res.status(403).json({ ok: false, error: "Wrong parent PIN." });
  }
  if (user) delete user.password_hash;
  res.json({
    ok: true,
    student: {
      full_name: user.full_name,
      total_tests_taken: user.total_tests_taken,
      average_score: user.average_score,
      target_exam: user.target_exam,
    },
    attempts: await all("SELECT * FROM test_attempts WHERE user_id = ? ORDER BY date_taken DESC LIMIT 20", [req.user.id]),
  });
});

router.get("/dictionary", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    const rows = await all("SELECT * FROM dictionary_entries ORDER BY word LIMIT 40");
    return res.json({ ok: true, entries: rows });
  }
  const rows = await all(
    "SELECT * FROM dictionary_entries WHERE word LIKE ? OR definition LIKE ? ORDER BY word LIMIT 40",
    ["%" + q + "%", "%" + q + "%"]
  );
  res.json({ ok: true, entries: rows });
});

router.get("/games/scores", requireAuth, async (req, res) => {
  res.json({ ok: true, scores: await all("SELECT * FROM game_scores WHERE user_id = ? ORDER BY rowid DESC LIMIT 20", [req.user.id]) });
});

router.get("/study/notes", async (_req, res) => {
  const topics = await all(
    "SELECT topics.*, subjects.name AS subject_name, subjects.code AS subject_code FROM topics JOIN subjects ON subjects.id = topics.subject_id ORDER BY subjects.name, topics.name"
  );
  res.json({ ok: true, notes: topics });
});

module.exports = router;

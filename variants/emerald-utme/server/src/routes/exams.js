import { Router } from "express";
import { db, rows } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function hideAnswers(question, options) {
  return {
    id: Number(question.id),
    subjectId: Number(question.subject_id),
    topicId: question.topic_id == null ? null : Number(question.topic_id),
    stem: question.stem,
    difficulty: question.difficulty,
    yearTag: question.year_tag,
    options: options.map((option) => ({ label: option.label, body: option.body })),
  };
}

router.post("/start", requireAuth, async (req, res) => {
  const subjectIds = Array.isArray(req.body?.subjectIds) ? req.body.subjectIds.map(Number).filter(Boolean) : [];
  if (!subjectIds.length) return res.status(400).json({ error: "subjectIds required" });
  const mode = String(req.body?.mode || "exam");
  const durationSec = Math.max(60, Number(req.body?.durationSec) || 7200);
  const perSubject = Math.min(60, Math.max(1, Number(req.body?.perSubject) || 40));
  const session = await db.execute({
    sql: "INSERT INTO exam_sessions (user_id, mode, subjects_json, duration_sec, status) VALUES (?, ?, ?, ?, 'in_progress')",
    args: [req.user.id, mode, JSON.stringify(subjectIds), durationSec],
  });
  const sessionId = Number(session.lastInsertRowid);
  const paper = [];
  let position = 1;
  for (const subjectId of subjectIds) {
    const questions = rows(await db.execute({
      sql: "SELECT * FROM questions WHERE subject_id = ? ORDER BY id LIMIT ?",
      args: [subjectId, perSubject],
    }));
    for (const question of questions) {
      await db.execute({
        sql: "INSERT INTO session_questions (session_id, question_id, position, subject_id) VALUES (?, ?, ?, ?)",
        args: [sessionId, question.id, position, subjectId],
      });
      const options = rows(await db.execute({
        sql: "SELECT label, body FROM options WHERE question_id = ? ORDER BY label",
        args: [question.id],
      }));
      paper.push({ position, ...hideAnswers(question, options) });
      position += 1;
    }
  }
  if (!paper.length) return res.status(404).json({ error: "No questions for those subjects" });
  res.json({ sessionId, durationSec, total: paper.length, questions: paper });
});

router.post("/:id/answer", requireAuth, async (req, res) => {
  const sessionId = Number(req.params.id);
  const owned = rows(await db.execute({
    sql: "SELECT id, status FROM exam_sessions WHERE id = ? AND user_id = ?",
    args: [sessionId, req.user.id],
  }));
  if (!owned[0]) return res.status(404).json({ error: "Session not found" });
  if (owned[0].status !== "in_progress") return res.status(409).json({ error: "Session already submitted" });
  const questionId = Number(req.body?.questionId);
  const onPaper = rows(await db.execute({
    sql: "SELECT id FROM session_questions WHERE session_id = ? AND question_id = ?",
    args: [sessionId, questionId],
  }));
  if (!onPaper.length) return res.status(400).json({ error: "Question is not on this paper" });
  const selected = req.body?.selectedLabel ? String(req.body.selectedLabel).trim().toUpperCase() : null;
  await db.execute({
    sql: `INSERT INTO session_answers (session_id, question_id, selected_label, flagged, time_spent_ms)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(session_id, question_id) DO UPDATE SET
            selected_label = excluded.selected_label,
            flagged = excluded.flagged,
            time_spent_ms = session_answers.time_spent_ms + excluded.time_spent_ms`,
    args: [sessionId, questionId, selected, req.body?.flagged ? 1 : 0, Number(req.body?.timeSpentMs) || 0],
  });
  res.json({ ok: true });
});

router.post("/:id/submit", requireAuth, async (req, res) => {
  const sessionId = Number(req.params.id);
  const owned = rows(await db.execute({
    sql: "SELECT id, status FROM exam_sessions WHERE id = ? AND user_id = ?",
    args: [sessionId, req.user.id],
  }));
  if (!owned[0]) return res.status(404).json({ error: "Session not found" });
  if (owned[0].status === "submitted") {
    const done = rows(await db.execute({ sql: "SELECT score, total FROM exam_sessions WHERE id = ?", args: [sessionId] }));
    return res.json({ ok: true, score: Number(done[0].score) || 0, total: Number(done[0].total) || 0 });
  }
  const items = rows(await db.execute({
    sql: "SELECT question_id FROM session_questions WHERE session_id = ? ORDER BY position",
    args: [sessionId],
  }));
  let score = 0;
  for (const item of items) {
    const answer = rows(await db.execute({
      sql: "SELECT selected_label FROM session_answers WHERE session_id = ? AND question_id = ?",
      args: [sessionId, item.question_id],
    }));
    const correct = rows(await db.execute({
      sql: "SELECT label FROM options WHERE question_id = ? AND is_correct = 1",
      args: [item.question_id],
    }));
    const selected = answer[0]?.selected_label || "";
    if (correct[0] && selected === String(correct[0].label).toUpperCase()) score += 1;
  }
  await db.execute({
    sql: "UPDATE exam_sessions SET status = 'submitted', score = ?, total = ?, submitted_at = datetime('now') WHERE id = ?",
    args: [score, items.length, sessionId],
  });
  res.json({ ok: true, score, total: items.length, percent: items.length ? Math.round((score / items.length) * 100) : 0 });
});

router.get("/:id", requireAuth, async (req, res) => {
  const sessionId = Number(req.params.id);
  const session = rows(await db.execute({
    sql: "SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?",
    args: [sessionId, req.user.id],
  }));
  if (!session[0]) return res.status(404).json({ error: "Session not found" });
  res.json({ session: session[0] });
});

export default router;

import { Router } from "express";
import { db, rows } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, async (req, res) => {
  const sessions = rows(await db.execute({
    sql: "SELECT id, mode, score, total, submitted_at, subjects_json FROM exam_sessions WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 20",
    args: [req.user.id],
  }));
  const history = sessions.map((s) => ({
    id: s.id,
    mode: s.mode,
    score: s.score,
    total: s.total,
    percent: s.total ? Math.round((s.score / s.total) * 100) : 0,
    submittedAt: s.submitted_at,
    subjects: JSON.parse(s.subjects_json),
  }));
  const avg = history.length ? Math.round(history.reduce((a, h) => a + h.percent, 0) / history.length) : 0;
  const topicRows = rows(await db.execute({
    sql: `SELECT t.name AS topic, s.name AS subject,
             SUM(CASE WHEN o.label = a.selected_label THEN 1 ELSE 0 END) AS correct,
             COUNT(*) AS attempts
      FROM session_answers a
      JOIN exam_sessions es ON es.id = a.session_id
      JOIN questions q ON q.id = a.question_id
      JOIN options o ON o.question_id = q.id AND o.is_correct = 1
      JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN topics t ON t.id = q.topic_id
      WHERE es.user_id = ? AND es.status = 'submitted' AND a.selected_label IS NOT NULL
      GROUP BY t.name, s.name`,
    args: [req.user.id],
  }));
  const mastery = topicRows.map((r) => ({
    topic: r.topic || "General",
    subject: r.subject,
    correct: Number(r.correct),
    attempts: Number(r.attempts),
    percent: Number(r.attempts) ? Math.round((Number(r.correct) / Number(r.attempts)) * 100) : 0,
  }));
  const weak = [...mastery].filter((m) => m.attempts >= 1).sort((a, b) => a.percent - b.percent).slice(0, 5);
  const speed = rows(await db.execute({
    sql: `SELECT AVG(a.time_spent_ms) AS avg_ms FROM session_answers a
      JOIN exam_sessions es ON es.id = a.session_id
      WHERE es.user_id = ? AND a.selected_label IS NOT NULL`,
    args: [req.user.id],
  }));
  res.json({
    attempts: history.length,
    averagePercent: avg,
    avgSecondsPerQuestion: speed[0]?.avg_ms ? Math.round(Number(speed[0].avg_ms) / 1000) : 0,
    history,
    mastery,
    weak,
  });
});

export default router;

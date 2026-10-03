import { Router } from "express";
import { db, rows } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/subjects", requireAuth, async (_req, res) => {
  const subjects = rows(await db.execute("SELECT id, code, name, compulsory, exam_count FROM subjects ORDER BY compulsory DESC, name"));
  const topics = rows(await db.execute("SELECT id, subject_id, name FROM topics ORDER BY name"));
  const counts = rows(await db.execute("SELECT subject_id, COUNT(*) AS c FROM questions GROUP BY subject_id"));
  const countMap = Object.fromEntries(counts.map((c) => [c.subject_id, Number(c.c)]));
  res.json({
    subjects: subjects.map((s) => ({
      ...s,
      compulsory: !!s.compulsory,
      questionCount: countMap[s.id] || 0,
      topics: topics.filter((t) => t.subject_id === s.id),
    })),
  });
});

router.get("/bank", requireAuth, async (req, res) => {
  const subjectId = Number(req.query.subjectId);
  const topicId = req.query.topicId ? Number(req.query.topicId) : null;
  if (!subjectId) return res.status(400).json({ error: "subjectId required" });
  const qsql = topicId
    ? "SELECT * FROM questions WHERE subject_id = ? AND topic_id = ? ORDER BY id"
    : "SELECT * FROM questions WHERE subject_id = ? ORDER BY id";
  const questions = rows(await db.execute({ sql: qsql, args: topicId ? [subjectId, topicId] : [subjectId] }));
  const payload = [];
  for (const q of questions) {
    const options = rows(await db.execute({ sql: "SELECT label, body, is_correct FROM options WHERE question_id = ? ORDER BY label", args: [q.id] }));
    payload.push({
      id: q.id,
      subjectId: q.subject_id,
      topicId: q.topic_id,
      stem: q.stem,
      difficulty: q.difficulty,
      explanation: q.explanation,
      yearTag: q.year_tag,
      options: options.map((o) => ({ label: o.label, body: o.body, correct: !!o.is_correct })),
    });
  }
  res.json({ questions: payload });
});

export default router;

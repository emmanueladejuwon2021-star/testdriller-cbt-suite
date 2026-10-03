import { migrate, db } from "../db/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "td-utme-dev-secret-change-me";
const failures = [];
function check(name, cond, detail = "") {
  if (!cond) failures.push(`${name}${detail ? ": " + detail : ""}`);
  else console.log("PASS", name);
}

await migrate();
const qCount = await db.execute("SELECT COUNT(*) AS c FROM questions");
check("question bank loaded", Number(qCount.rows[0].c) >= 180, `count=${qCount.rows[0].c}`);

const subjects = await db.execute("SELECT id, code FROM subjects ORDER BY id");
check("eight subjects", subjects.rows.length === 8);

const email = `agent${Date.now()}@drill.test`;
const hash = await bcrypt.hash("secret12", 8);
const user = await db.execute({
  sql: "INSERT INTO users (name, email, password_hash, device_id, activated, plan) VALUES ('Agent', ?, ?, 'dev-1', 1, 'trial')",
  args: [email, hash],
});
const token = jwt.sign({ sub: Number(user.lastInsertRowid), email }, JWT_SECRET, { expiresIn: "1h" });
check("jwt issued", token.split(".").length === 3);

let expiredOk = false;
try {
  jwt.verify(jwt.sign({ sub: 1 }, JWT_SECRET, { expiresIn: "-1s" }), JWT_SECRET);
} catch (e) {
  expiredOk = e.name === "TokenExpiredError";
}
check("expired token rejected", expiredOk);

const ids = subjects.rows.filter((s) => ["ENG", "MTH", "PHY", "CHM"].includes(s.code)).map((s) => Number(s.id));
check("exam subject set", ids.length === 4);

const session = await db.execute({
  sql: "INSERT INTO sessions (user_id, mode, duration_sec, total) VALUES (?, 'exam', 7200, 0)",
  args: [Number(user.lastInsertRowid)],
});
const sid = Number(session.lastInsertRowid);
let pos = 1;
for (const subjectId of ids) {
  await db.execute({ sql: "INSERT INTO session_subjects (session_id, subject_id) VALUES (?, ?)", args: [sid, subjectId] });
  const qs = await db.execute({ sql: "SELECT id FROM questions WHERE subject_id = ? LIMIT 45", args: [subjectId] });
  check(`45 items for subject ${subjectId}`, qs.rows.length === 45);
  for (const q of qs.rows) {
    await db.execute({
      sql: "INSERT INTO session_items (session_id, question_id, position, subject_id, selected) VALUES (?, ?, ?, ?, 'A')",
      args: [sid, q.id, pos, subjectId],
    });
    pos += 1;
  }
}
check("exam has 180 items", pos - 1 === 180);
await db.execute({ sql: "UPDATE sessions SET total = 180 WHERE id = ?", args: [sid] });

const items = await db.execute({ sql: "SELECT id, question_id, selected FROM session_items WHERE session_id = ?", args: [sid] });
let score = 0;
for (const item of items.rows) {
  const opt = await db.execute({ sql: "SELECT label FROM options WHERE question_id = ? AND is_correct = 1", args: [item.question_id] });
  const correct = item.selected === opt.rows[0].label ? 1 : 0;
  score += correct;
  await db.execute({ sql: "UPDATE session_items SET correct = ? WHERE id = ?", args: [correct, item.id] });
}
await db.execute({ sql: "UPDATE sessions SET status = 'submitted', score = ?, submitted_at = datetime('now') WHERE id = ?", args: [score, sid] });
check("score within range", score >= 0 && score <= 180, `score=${score}`);

const analytics = await db.execute({
  sql: `SELECT sub.name, SUM(si.correct) AS correct, COUNT(*) AS total
        FROM session_items si JOIN subjects sub ON sub.id = si.subject_id
        WHERE si.session_id = ? GROUP BY sub.id`,
  args: [sid],
});
check("subject breakdown has 4 rows", analytics.rows.length === 4);

const fk = await db.execute("PRAGMA foreign_keys");
check("foreign keys enabled", Number(fk.rows[0].foreign_keys) === 1);

if (failures.length) {
  console.error("FAILURES", failures);
  process.exit(1);
}
console.log("ALL TESTS PASSED", { score, email });

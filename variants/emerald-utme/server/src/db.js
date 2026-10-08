import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(dataDir, "testdriller.db")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken: authToken || undefined,
});

export async function migrate() {
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      activation_key TEXT,
      activated INTEGER NOT NULL DEFAULT 0,
      plan TEXT NOT NULL DEFAULT 'trial',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      label TEXT,
      bound_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, device_id)
    );

    CREATE TABLE IF NOT EXISTS activation_keys (
      key_code TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      max_devices INTEGER NOT NULL DEFAULT 2,
      used_by INTEGER REFERENCES users(id),
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      compulsory INTEGER NOT NULL DEFAULT 0,
      exam_count INTEGER NOT NULL DEFAULT 40
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      topic_id INTEGER REFERENCES topics(id),
      stem TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      explanation TEXT NOT NULL,
      image_url TEXT,
      year_tag TEXT DEFAULT 'UTME'
    );
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      body TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      subjects_json TEXT NOT NULL,
      duration_sec INTEGER NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT,
      score INTEGER,
      total INTEGER,
      status TEXT NOT NULL DEFAULT 'in_progress'
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON exam_sessions(user_id);

    CREATE TABLE IF NOT EXISTS session_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      position INTEGER NOT NULL,
      subject_id INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sq_session ON session_questions(session_id, position);

    CREATE TABLE IF NOT EXISTS session_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      selected_label TEXT,
      flagged INTEGER NOT NULL DEFAULT 0,
      time_spent_ms INTEGER NOT NULL DEFAULT 0,
      UNIQUE(session_id, question_id)
    );
  `);

  for (const sql of [
    "ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'trial'",
    "ALTER TABLE activation_keys ADD COLUMN used_at TEXT",
  ]) {
    try { await db.execute(sql); } catch { /* column already present */ }
  }

  const keys = [
    ["TD-EMERALD-2026", "annual", 2],
    ["TD-SLATE-DEMO", "demo", 1],
    ["TD-AMBER-LAB", "lab", 3],
  ];
  for (const [key_code, plan, max_devices] of keys) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO activation_keys (key_code, plan, max_devices) VALUES (?, ?, ?)",
      args: [key_code, plan, max_devices],
    });
  }
}

export function rows(result) {
  return result.rows || [];
}

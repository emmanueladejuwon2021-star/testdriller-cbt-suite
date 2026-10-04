-- Turso / libSQL schema for the CBT suite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  state TEXT,
  target_exam TEXT DEFAULT 'JAMB',
  serial_number TEXT,
  product_key TEXT,
  activation_status TEXT DEFAULT 'demo',
  expiry_date TEXT,
  total_tests_taken INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  parent_pin TEXT DEFAULT '2468',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activation_keys (
  id TEXT PRIMARY KEY,
  key_code TEXT UNIQUE NOT NULL,
  is_used INTEGER DEFAULT 0,
  assigned_user_id TEXT,
  activated_at TEXT,
  device_fingerprint TEXT,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  icon_name TEXT,
  total_questions_count INTEGER DEFAULT 0,
  syllabus_version TEXT,
  exam_suites TEXT DEFAULT 'JAMB,WAEC,POST-UTME'
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  syllabus_overview TEXT,
  weight_percentage REAL DEFAULT 0,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS literature_books (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  genre TEXT,
  book_cover_url TEXT,
  full_summary TEXT,
  themes TEXT,
  character_profiles_json TEXT,
  key_quotes_json TEXT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS literature_chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter_number INTEGER,
  title TEXT,
  content_summary TEXT,
  key_takeaways TEXT,
  practice_question_ids_json TEXT,
  FOREIGN KEY (book_id) REFERENCES literature_books(id)
);

CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  title TEXT,
  passage_body TEXT NOT NULL,
  image_url TEXT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  topic_id TEXT,
  year INTEGER,
  exam_type TEXT NOT NULL,
  passage_id TEXT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  detailed_explanation TEXT,
  difficulty_level TEXT DEFAULT 'Medium',
  image_url TEXT,
  audio_url TEXT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  FOREIGN KEY (passage_id) REFERENCES passages(id)
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_type, year);
CREATE INDEX IF NOT EXISTS idx_questions_passage ON questions(passage_id);

CREATE TABLE IF NOT EXISTS test_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_mode TEXT NOT NULL,
  exam_type TEXT,
  subjects_json TEXT NOT NULL,
  overall_score REAL DEFAULT 0,
  total_possible REAL DEFAULT 0,
  percentage REAL DEFAULT 0,
  duration_allowed_seconds INTEGER,
  time_spent_seconds INTEGER,
  date_taken TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'Completed',
  session_state_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS test_answers_log (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  user_selected_option TEXT,
  correct_option TEXT,
  is_correct INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  was_bookmarked INTEGER DEFAULT 0,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  note TEXT,
  subject_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  topic_id TEXT,
  front_question TEXT NOT NULL,
  back_answer TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  high_score INTEGER DEFAULT 0,
  level_reached INTEGER DEFAULT 1,
  date_played TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS institution_cutoffs (
  id TEXT PRIMARY KEY,
  institution_name TEXT NOT NULL,
  institution_type TEXT,
  course_name TEXT NOT NULL,
  jamb_cutoff INTEGER,
  post_utme_cutoff INTEGER,
  required_o_level_subjects_json TEXT,
  required_jamb_combination_json TEXT
);

CREATE TABLE IF NOT EXISTS video_tutorials (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  topic_id TEXT,
  video_title TEXT NOT NULL,
  video_url TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  transcript_text TEXT
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  last_synced_at TEXT DEFAULT (datetime('now')),
  records_synced_count INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'ok'
);

CREATE TABLE IF NOT EXISTS dictionary_entries (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  exam_hint TEXT
);
CREATE INDEX IF NOT EXISTS idx_dictionary_word ON dictionary_entries(word);

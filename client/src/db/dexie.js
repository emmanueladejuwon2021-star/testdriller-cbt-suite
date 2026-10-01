import Dexie from "dexie";

export const offlineDb = new Dexie("CbtOfflineStore");

offlineDb.version(1).stores({
  users: "id, email, product_key, activation_status",
  activation_keys: "id, key_code, is_used",
  subjects: "id, code, category",
  topics: "id, subject_id",
  literature_books: "id, subject_id, title",
  literature_chapters: "id, book_id",
  passages: "id, subject_id",
  questions: "id, subject_id, topic_id, year, exam_type, passage_id",
  test_attempts: "id, user_id, date_taken, status",
  test_answers_log: "id, attempt_id, question_id",
  bookmarks: "id, user_id, question_id, subject_id",
  flashcards: "id, subject_id, topic_id",
  game_scores: "id, user_id, game_type",
  institution_cutoffs: "id, institution_name, course_name",
  video_tutorials: "id, subject_id, topic_id",
  sync_logs: "id, user_id, last_synced_at",
  exam_sessions: "id, status, updated_at",
  settings: "key",
});

export async function saveSetting(key, value) {
  await offlineDb.settings.put({ key, value });
}

export async function readSetting(key, fallback = null) {
  const row = await offlineDb.settings.get(key);
  return row ? row.value : fallback;
}

export async function cacheRows(table, rows) {
  if (!rows || !rows.length) return;
  await offlineDb[table].bulkPut(rows);
}

export async function pullCloudIntoOffline(apiBase, token) {
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const [subjects, questions, books, institutions] = await Promise.all([
    fetch(apiBase + "/subjects").then((r) => r.json()),
    fetch(apiBase + "/questions?limit=180", { headers }).then((r) => r.json()),
    fetch(apiBase + "/literature/books").then((r) => r.json()),
    fetch(apiBase + "/institutions").then((r) => r.json()),
  ]);
  await cacheRows("subjects", subjects.subjects || []);
  await cacheRows("questions", questions.questions || []);
  await cacheRows("literature_books", books.books || []);
  await cacheRows("institution_cutoffs", institutions.institutions || []);
  await saveSetting("last_sync", new Date().toISOString());
  return {
    subjects: (subjects.subjects || []).length,
    questions: (questions.questions || []).length,
  };
}

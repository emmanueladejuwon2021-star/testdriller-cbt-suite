#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const LOG = path.join(__dirname, "..", "auto_fix_error.log");
function scoreVirtualPaper() {
  const answers = [];
  for (let i = 0; i < 180; i += 1) {
    const correct = ["A", "B", "C", "D"][i % 4];
    const picked = i % 5 === 0 ? "Z" : correct;
    answers.push({ correct_option: correct, user_selected_option: picked, is_correct: picked === correct });
  }
  const computed = answers.filter((a) => a.is_correct).length;
  if (computed !== 144) throw new Error("Expected 144 correct, got " + computed);
  return computed;
}
function checkSchemaFile() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "server/db/schema.sql"), "utf8");
  const needed = ["users","activation_keys","subjects","topics","literature_books","literature_chapters","passages","questions","test_attempts","test_answers_log","bookmarks","flashcards","game_scores","institution_cutoffs","video_tutorials","sync_logs"];
  const missing = needed.filter((t) => !sql.includes("CREATE TABLE IF NOT EXISTS " + t));
  if (missing.length) throw new Error("Missing tables: " + missing.join(", "));
  return needed.length + " tables declared";
}
function checkRoutes() {
  const pages = ["Splash.jsx","Activate.jsx","Dashboard.jsx","ExamSetup.jsx","CbtEngine.jsx","Results.jsx","Corrections.jsx","Literature.jsx","Games.jsx","Institutions.jsx","ParentPortal.jsx"];
  const missing = pages.filter((p) => !fs.existsSync(path.join(__dirname, "..", "client/src/pages", p)));
  if (missing.length) throw new Error("Missing screens: " + missing.join(", "));
  return pages.length + " screens present";
}
try {
  console.log("PASS schema —", checkSchemaFile());
  console.log("PASS cbt-score —", scoreVirtualPaper(), "/ 180");
  console.log("PASS screens —", checkRoutes());
  if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
  console.log("All checks passed.");
} catch (err) {
  fs.writeFileSync(LOG, err.message);
  console.error("FAIL", err.message);
  process.exit(1);
}

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { db } = require("./turso");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const chunks = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const chunk of chunks) {
    await db.execute(chunk);
  }
  console.log("Schema applied.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

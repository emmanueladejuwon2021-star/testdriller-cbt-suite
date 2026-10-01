const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

function resolveUrl() {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  const dataDir = path.join(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return "file:" + path.join(dataDir, "cbt.db");
}

const db = createClient({
  url: resolveUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

async function run(sql, args = []) {
  return db.execute({ sql, args });
}

async function all(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows || [];
}

async function one(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

module.exports = { db, run, all, one };

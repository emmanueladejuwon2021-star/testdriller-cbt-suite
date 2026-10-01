const { randomUUID } = require("crypto");
function id() {
  return randomUUID();
}
function formatKey(raw) {
  const clean = String(raw || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 16);
  return clean.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
module.exports = { id, formatKey };

import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { db, rows } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(80),
  deviceId: z.string().min(4).max(80).optional(),
});

function publicUser(user) {
  return {
    id: Number(user.id),
    name: user.full_name,
    email: user.email,
    plan: user.plan || "trial",
    activated: Number(user.activated),
    deviceId: user.device_id || null,
  };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password, deviceId } = parsed.data;
  const existing = rows(await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email.toLowerCase()] }));
  if (existing.length) return res.status(409).json({ error: "Email already registered" });
  const password_hash = await bcrypt.hash(password, 10);
  const result = await db.execute({
    sql: "INSERT INTO users (full_name, email, password_hash, activated, plan) VALUES (?, ?, ?, 0, 'trial')",
    args: [name, email.toLowerCase(), password_hash],
  });
  const userId = Number(result.lastInsertRowid);
  if (deviceId) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO devices (user_id, device_id) VALUES (?, ?)",
      args: [userId, deviceId],
    });
  }
  const user = { id: userId, full_name: name, email: email.toLowerCase(), plan: "trial", activated: 0, device_id: deviceId || null };
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password, deviceId } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const found = rows(await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [String(email).toLowerCase()] }));
  const user = found[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (deviceId) {
    const bound = rows(await db.execute({ sql: "SELECT device_id FROM devices WHERE user_id = ?", args: [user.id] }));
    const known = bound.some((row) => row.device_id === deviceId);
    if (bound.length && !known && user.plan !== "trial") {
      return res.status(403).json({ error: "This activation is bound to another device" });
    }
    if (!known) {
      await db.execute({ sql: "INSERT OR IGNORE INTO devices (user_id, device_id) VALUES (?, ?)", args: [user.id, deviceId] });
    }
    user.device_id = deviceId;
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const found = rows(await db.execute({
    sql: "SELECT id, full_name, email, plan, activated, activation_key FROM users WHERE id = ?",
    args: [req.user.id],
  }));
  const user = found[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  const device = rows(await db.execute({ sql: "SELECT device_id FROM devices WHERE user_id = ? ORDER BY bound_at DESC LIMIT 1", args: [user.id] }));
  res.json({ ...publicUser({ ...user, device_id: device[0]?.device_id }), activationKey: user.activation_key });
});

router.post("/activate", requireAuth, async (req, res) => {
  const key = String(req.body?.key || "").trim().toUpperCase();
  if (!key) return res.status(400).json({ error: "Activation key required" });
  const found = rows(await db.execute({ sql: "SELECT * FROM activation_keys WHERE key_code = ?", args: [key] }));
  const row = found[0];
  if (!row) return res.status(404).json({ error: "Invalid activation key" });
  if (row.used_by && Number(row.used_by) !== Number(req.user.id)) return res.status(409).json({ error: "Key already used" });
  await db.execute({ sql: "UPDATE activation_keys SET used_by = ?, used_at = datetime('now') WHERE key_code = ?", args: [req.user.id, key] });
  await db.execute({
    sql: "UPDATE users SET activated = 1, plan = ?, activation_key = ? WHERE id = ?",
    args: [row.plan, key, req.user.id],
  });
  if (req.body?.deviceId) {
    await db.execute({ sql: "INSERT OR IGNORE INTO devices (user_id, device_id) VALUES (?, ?)", args: [req.user.id, req.body.deviceId] });
  }
  res.json({ ok: true, plan: row.plan });
});

export default router;

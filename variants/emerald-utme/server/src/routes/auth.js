import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "td-utme-dev-secret-change-me";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(80),
  deviceId: z.string().min(4).max(80),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, email, password, deviceId } = parsed.data;
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email.toLowerCase()] });
  if (existing.rows.length) return res.status(409).json({ error: "Email already registered" });
  const password_hash = await bcrypt.hash(password, 10);
  const result = await db.execute({
    sql: "INSERT INTO users (name, email, password_hash, device_id, activated, plan) VALUES (?, ?, ?, ?, 1, 'trial')",
    args: [name, email.toLowerCase(), password_hash, deviceId],
  });
  const user = { id: Number(result.lastInsertRowid), name, email: email.toLowerCase(), plan: "trial", activated: 1 };
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user });
});

router.post("/login", async (req, res) => {
  const { email, password, deviceId } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const found = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [String(email).toLowerCase()] });
  const user = found.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  if (user.device_id && deviceId && user.device_id !== deviceId && user.plan !== "trial") {
    return res.status(403).json({ error: "This activation is bound to another device" });
  }
  if (deviceId && !user.device_id) {
    await db.execute({ sql: "UPDATE users SET device_id = ? WHERE id = ?", args: [deviceId, user.id] });
  }
  const token = jwt.sign({ sub: Number(user.id), email: user.email }, JWT_SECRET, { expiresIn: "12h" });
  res.json({
    token,
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      plan: user.plan,
      activated: Number(user.activated),
      deviceId: user.device_id,
    },
  });
});

router.get("/me", authRequired, async (req, res) => {
  const found = await db.execute({ sql: "SELECT id, name, email, plan, activated, device_id, activation_key FROM users WHERE id = ?", args: [req.user.id] });
  const user = found.rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    id: Number(user.id),
    name: user.name,
    email: user.email,
    plan: user.plan,
    activated: Number(user.activated),
    deviceId: user.device_id,
    activationKey: user.activation_key,
  });
});

router.post("/activate", authRequired, async (req, res) => {
  const key = String(req.body?.key || "").trim().toUpperCase();
  if (!key) return res.status(400).json({ error: "Activation key required" });
  const found = await db.execute({ sql: "SELECT * FROM activation_keys WHERE key = ?", args: [key] });
  const row = found.rows[0];
  if (!row) return res.status(404).json({ error: "Invalid activation key" });
  if (row.used_by && Number(row.used_by) !== req.user.id) return res.status(409).json({ error: "Key already used" });
  await db.execute({ sql: "UPDATE activation_keys SET used_by = ?, used_at = datetime('now') WHERE key = ?", args: [req.user.id, key] });
  await db.execute({
    sql: "UPDATE users SET activated = 1, plan = ?, activation_key = ?, device_id = COALESCE(device_id, ?) WHERE id = ?",
    args: [row.plan, key, req.body?.deviceId || null, req.user.id],
  });
  res.json({ ok: true, plan: row.plan });
});

export default router;

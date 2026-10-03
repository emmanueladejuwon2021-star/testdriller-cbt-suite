import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "td-utme-dev-secret-change-me";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(401).json({ error: expired ? "Token expired" : "Invalid token" });
  }
}

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "td-utme-dev-secret-change-me";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, activated: !!user.activated },
    SECRET,
    { expiresIn: "12h" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return res.status(401).json({ error: expired ? "Token expired" : "Invalid token", code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID" });
  }
}

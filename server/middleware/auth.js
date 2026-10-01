const jwt = require("jsonwebtoken");

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Please sign in." });
    }
    next();
  });
}

module.exports = { optionalAuth, requireAuth };

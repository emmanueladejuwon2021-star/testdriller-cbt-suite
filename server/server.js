require("dotenv").config();
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");

const app = express();
const port = Number(process.env.PORT || 5050);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "4mb" }));
app.use("/api", api);

app.get("/", (_req, res) => {
  res.json({
    name: "CBT Suite API",
    health: "/api/health",
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Server error." });
});

app.listen(port, () => {
  console.log("API listening on " + port);
});

module.exports = app;

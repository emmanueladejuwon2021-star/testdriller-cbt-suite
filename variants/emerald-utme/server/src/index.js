import express from "express";
import cors from "cors";
import { migrate } from "./db.js";
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/questions.js";
import examRoutes from "./routes/exams.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "testdriller-utme", db: process.env.TURSO_DATABASE_URL ? "turso" : "libsql-file" });
});
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

const port = Number(process.env.PORT || 4000);

export async function start() {
  await migrate();
  return app.listen(port, () => {
    console.log(`Test Driller API listening on ${port}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  start();
}

export default app;

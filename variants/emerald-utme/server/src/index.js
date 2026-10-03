import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { migrate } from "./db/client.js";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exam.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "testdriller-utme", db: process.env.TURSO_DATABASE_URL ? "turso" : "libsql-file" });
});
app.use("/api/auth", authRoutes);
app.use("/api", examRoutes);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(200).send("API ready. Start the Vite client for the UI.");
  });
});

const port = process.env.PORT || 8787;
await migrate();
app.listen(port, () => {
  console.log(`Test Driller API listening on ${port}`);
});

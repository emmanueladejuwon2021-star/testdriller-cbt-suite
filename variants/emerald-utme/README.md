# Emerald Drill UTME

Integrated variant of the Test Driller UTME workflow inside testdriller-cbt-suite.
Distinct emerald / slate-blue theme. Not an official TestDriller product.

- React + Tailwind + Redux Toolkit
- Express API
- Turso-compatible libSQL (`@libsql/client`). Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for hosted Turso; otherwise a local SQLite file is used at `server/data/testdriller.db`.

## Run

```bash
cd variants/emerald-utme/server && npm install && npm run seed && npm start
cd variants/emerald-utme/client && npm install && npm run dev
```

Demo activation key: `TD-EMERALD-2026`

The suite app on port 5050 remains the multi-exam CBT shell. This variant is the dedicated UTME simulation (English + 3 subjects, exam / practice / correction, question grid, device binding).

# Emerald Drill — Test Driller UTME clone

MERN-style stack with React, Redux Toolkit, Express, and Turso-compatible libSQL.

## Run
```bash
cd server && npm install && npm run seed && npm start
cd ../client && npm install && npm run dev
```

Demo activation keys: `UTME-EMERALD-2026`, `UTME-SLATE-DEMO`.

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to use hosted Turso. Otherwise the API uses a local libSQL file at `server/data/testdriller.db`.

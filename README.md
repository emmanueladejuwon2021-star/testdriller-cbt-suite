# TestDriller-style CBT Suite

A production-leaning Computer Based Testing app for Nigerian exams:
JAMB / UTME, WAEC / SSCE, Post-UTME, NCEE, and BECE.

Stack:
- Frontend: React (Vite), Tailwind CSS, Lucide icons, Dexie.js (IndexedDB offline store)
- Backend: Express.js
- Cloud / local SQL: Turso (libSQL) via @libsql/client

This is an independent implementation of a CBT study product. It is not an official TestDriller product. Official exam questions are copyrighted. This repo ships schema, engines, screens, and clearly labelled sample items only. Load licensed question banks before classroom or commercial use.

## Quick start

```
cp .env.example .env
npm install
cd client && npm install && cd ..
npm run db:migrate
npm run db:seed
npm run dev
```

API: http://localhost:5050
UI: http://localhost:5173

Demo product key after seed: TDRL-DEMO-2026-TEST
Parent PIN: 2468

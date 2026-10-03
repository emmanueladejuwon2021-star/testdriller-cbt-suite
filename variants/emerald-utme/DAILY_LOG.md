# Daily fix log — 2026-10-03

- Integrated the local Emerald Drill UTME clone into `emmanueladejuwon2021-star/testdriller-cbt-suite` under `variants/emerald-utme`.
- Kept the suite shell (JAMB/WAEC/Post-UTME/NCEE/BECE) intact on the main client/server.
- Auth, activation keys, device binding, question bank, exam/practice/correction sessions, analytics, and the React exam shell are the variant source of truth.
- Auto-fix carried forward: seed awaits option inserts; submitted sessions lock answers (409); explanations stay hidden until correction/results.

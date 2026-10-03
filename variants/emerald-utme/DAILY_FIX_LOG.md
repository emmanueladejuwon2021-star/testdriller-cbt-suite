# Daily fix log

## 2026-10-03 — Cycle 1 (greenfield)
- Built auth, activation keys, device binding, exam/practice/correction sessions, scoring, and subject analytics on libSQL.
- Seeded 8 subjects with 50 items each (400 questions) so a 4x45 UTME paper can be assembled.
- Frontend mirrors the desktop flow: login, 4-subject pick, mode, full-screen paper with timer, calculator, question grid, summary, correction log.
- Theme is emerald/slate, not the original orange shell.
- Test harness covers bank size, 180-item exam assembly, scoring range, foreign keys, and expired JWT.
- Fix: Clear answer now writes selected = NULL instead of COALESCE, which kept the previous choice.

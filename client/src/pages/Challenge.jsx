import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell.jsx";
import { offlineDb } from "../db/dexie.js";
import { api } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

const KEY = "utme_challenge_board";

function readBoard() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export default function Challenge() {
  const { user } = useApp();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [rival, setRival] = useState("");
  const [items, setItems] = useState([]);
  const [pick, setPick] = useState({});
  const [board, setBoard] = useState(readBoard);
  const [note, setNote] = useState("");
  useEffect(() => {
    offlineDb.subjects.toArray().then((rows) => {
      setSubjects(rows);
      if (rows[0]) setSubjectId(rows[0].id);
    });
  }, []);
  async function start() {
    const name = rival.trim();
    if (!name) { setNote("Type a rival name first."); return; }
    const rows = (await offlineDb.questions.toArray()).filter((q) => q.subject_id === subjectId).slice(0, 5);
    if (!rows.length) { setNote("No questions for that subject in the offline store."); setItems([]); return; }
    setItems(rows);
    setPick({});
    setNote("");
  }
  async function finish() {
    const score = items.filter((q) => pick[q.id] === q.correct_option).length;
    const subject = subjects.find((s) => s.id === subjectId);
    const row = { id: Date.now(), rival: rival.trim(), subject: subject?.name || "Subject", you: score, total: items.length, at: new Date().toISOString() };
    const next = [row, ...board].slice(0, 12);
    setBoard(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setItems([]);
    setNote("You scored " + score + " of " + row.total + " against " + row.rival + ".");
    try {
      if (user) await api("/games/scores", { method: "POST", body: JSON.stringify({ game_type: "utme-challenge", score, high_score: score, level_reached: 1 }) });
    } catch { /* board stays on this device */ }
  }
  return (
    <Shell title="UTME Challenge" back="/">
      <p className="text-sm mb-4">Sit a short paper and keep a local scoreboard. This is practice, not a live prize room.</p>
      <label className="card-soft p-3 mb-3 block text-sm">
        Rival name
        <input className="mt-1 w-full rounded-lg border px-2 py-1 bg-white" value={rival} onChange={(e) => setRival(e.target.value)} placeholder="Ada" />
      </label>
      <label className="card-soft p-3 mb-3 block text-sm">
        Subject
        <select className="mt-1 w-full rounded-lg border px-2 py-1 bg-white" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      {!items.length && <button type="button" onClick={start} className="w-full rounded-pill bg-sage-700 text-white py-3 font-semibold">Start 5-question challenge</button>}
      {note && <p className="text-sm mt-3">{note}</p>}
      {items.map((q, i) => (
        <article key={q.id} className="card-soft p-3 mt-3">
          <p className="font-semibold text-sm mb-2">{i + 1}. {q.question_text}</p>
          {["A", "B", "C", "D"].map((opt) => (
            <label key={opt} className="flex gap-2 text-sm mb-1">
              <input type="radio" name={q.id} checked={pick[q.id] === opt} onChange={() => setPick((p) => ({ ...p, [q.id]: opt }))} />
              <span>{opt}. {q["option_" + opt.toLowerCase()]}</span>
            </label>
          ))}
        </article>
      ))}
      {items.length > 0 && <button type="button" onClick={finish} className="w-full rounded-pill bg-terra-700 text-white py-3 font-semibold mt-4">Lock scores</button>}
      <section className="mt-5">
        <h2 className="font-semibold text-sage-700 mb-2">Scoreboard</h2>
        {board.length === 0 && <p className="text-sm">No challenges yet.</p>}
        {board.map((row) => (
          <p key={row.id} className="card-soft p-3 mb-2 text-sm">{row.you}/{row.total} in {row.subject} vs {row.rival}</p>
        ))}
      </section>
      <Link to="/games" className="text-sm text-sage-700 underline mt-3 inline-block">Back to games</Link>
    </Shell>
  );
}

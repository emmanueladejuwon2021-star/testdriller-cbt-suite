import React, { useMemo, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

const pairs = [
  ["Na", "Sodium"],
  ["elastic", "Demand reacts strongly"],
  ["25 m", "20 east and 15 north"],
  ["leaves", "Photosynthesis site"]
];

export default function Games() {
  const deck = useMemo(() => pairs.flatMap(([a, b]) => [a, b]).sort(() => Math.random() - 0.5), []);
  const [open, setOpen] = useState([]);
  const [done, setDone] = useState([]);
  const [moves, setMoves] = useState(0);
  const [saved, setSaved] = useState("");

  function flip(label) {
    if (done.includes(label) || open.includes(label) || open.length === 2) return;
    const next = [...open, label];
    setOpen(next);
    setMoves((n) => n + 1);
    if (next.length === 2) {
      const match = pairs.some((pair) => pair.includes(next[0]) && pair.includes(next[1]));
      setTimeout(() => {
        if (match) setDone((prev) => [...prev, ...next]);
        setOpen([]);
      }, 500);
    }
  }

  async function saveScore() {
    const score = Math.max(0, 100 - moves * 5);
    try {
      await api("/games/scores", { method: "POST", body: { game_type: "match", score, high_score: score, level_reached: 1 } });
      setSaved("Score saved.");
    } catch (err) {
      setSaved(err.message || "Sign in before saving a score.");
    }
  }

  return (
    <Shell title="Match game" back="/">
      <p className="text-sm text-sage-600 mb-3">Pair the term with its meaning. Moves: {moves}</p>
      <div className="grid grid-cols-2 gap-3">
        {deck.map((label) => {
          const face = open.includes(label) || done.includes(label);
          return (
            <button key={label} onClick={() => flip(label)} className={`card-soft p-4 min-h-20 text-sm font-semibold ${done.includes(label) ? "bg-sage-100" : ""}`}>
              {face ? label : "Hidden"}
            </button>
          );
        })}
      </div>
      {done.length === deck.length && (
        <button onClick={saveScore} className="mt-4 w-full rounded-2xl bg-sage-700 text-white py-3">Save score</button>
      )}
      {saved && <p className="mt-3 text-sm">{saved}</p>}
    </Shell>
  );
}

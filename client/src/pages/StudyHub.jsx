import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
export default function StudyHub() {
  const [cards, setCards] = useState([]);
  const [flip, setFlip] = useState(false);
  useEffect(() => { api("/flashcards").then((d) => setCards(d.flashcards || [])).catch(() => {}); }, []);
  const card = cards[0];
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-semibold mb-4">Study notes and assistant</h1>
      {card && <button onClick={() => setFlip((f) => !f)} className="w-full min-h-32 rounded-xl bg-blue-700 text-white p-6">{flip ? card.back_answer : card.front_question}</button>}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [known, setKnown] = useState(0);

  useEffect(() => {
    api("/flashcards").then((data) => setCards(data.flashcards || [])).catch(() => setCards([]));
  }, []);

  const card = cards[index];

  function next(gotIt) {
    if (gotIt) setKnown((n) => n + 1);
    setShow(false);
    setIndex((i) => (cards.length ? (i + 1) % cards.length : 0));
  }

  return (
    <Shell title="Flashcards" back="/">
      <p className="text-sm text-sage-600 mb-3">Known this round: {known}</p>
      {!card && <p className="card-soft p-4 text-sm">No cards yet. Seed the database to load the starter pack.</p>}
      {card && (
        <button onClick={() => setShow((v) => !v)} className="card-soft w-full p-8 text-left min-h-48">
          <p className="text-xs uppercase tracking-wide text-sage-500">{show ? "Answer" : "Question"}</p>
          <p className="mt-3 text-lg font-semibold">{show ? card.back_answer : card.front_question}</p>
          <p className="mt-6 text-xs text-sage-500">Tap the card to flip</p>
        </button>
      )}
      {card && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => next(false)} className="rounded-2xl bg-terra-500 text-white py-3">Still learning</button>
          <button onClick={() => next(true)} className="rounded-2xl bg-sage-700 text-white py-3">I know it</button>
        </div>
      )}
    </Shell>
  );
}

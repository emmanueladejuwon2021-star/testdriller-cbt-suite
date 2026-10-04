import React, { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

export default function Dictionary() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");

  async function search(value) {
    setQ(value);
    try {
      const data = await api("/dictionary?q=" + encodeURIComponent(value));
      setRows(data.entries || []);
      setNote("");
    } catch (err) {
      setNote(err.message || "Dictionary is offline.");
    }
  }

  useEffect(() => { search(""); }, []);

  return (
    <Shell title="Dictionary" back="/">
      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Search a word"
        className="w-full rounded-2xl border border-sage-200 bg-parchment px-4 py-3 mb-4"
      />
      {note && <p className="text-sm text-terra-700 mb-3">{note}</p>}
      {rows.length === 0 && <p className="text-sm text-sage-500">No match yet. Try elastic, chlorophyll, or constitution.</p>}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="card-soft p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl text-sage-700">{row.word}</h2>
              <span className="text-xs text-sage-500">{row.part_of_speech}</span>
            </div>
            <p className="mt-2 text-sm">{row.definition}</p>
            <p className="mt-2 text-sm text-sage-600">{row.example_sentence}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-wood">{row.exam_hint}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}

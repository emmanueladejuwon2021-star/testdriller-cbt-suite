import React, { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

export default function Literature() {
  const [books, setBooks] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => { api("/literature/books").then((d) => setBooks(d.books || [])).catch(() => {}); }, []);
  async function openBook(id) {
    if (!id) return setActive(null);
    setActive(await api("/literature/books/" + id));
  }
  return (
    <Shell title="Literature" back="/">
      <select className="w-full rounded-2xl border border-sage-200 bg-parchment px-3 py-3" onChange={(e) => openBook(e.target.value)}>
        <option value="">Choose a book</option>
        {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>
      {active?.book && (
        <article className="card-soft p-4 mt-4">
          <h2 className="font-semibold">{active.book.title}</h2>
          <p className="text-sm text-sage-600">{active.book.author}</p>
          <p className="mt-3 text-sm">{active.book.full_summary}</p>
          <div className="mt-4 space-y-2">
            {(active.chapters || []).map((chapter) => (
              <div key={chapter.id} className="rounded-xl bg-sage-50 p-3 text-sm">
                <p className="font-semibold">Chapter {chapter.chapter_number}: {chapter.title}</p>
                <p className="mt-1">{chapter.content_summary}</p>
              </div>
            ))}
          </div>
        </article>
      )}
    </Shell>
  );
}

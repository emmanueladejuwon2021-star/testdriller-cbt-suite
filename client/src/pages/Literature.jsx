import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
export default function Literature() {
  const [books, setBooks] = useState([]);
  const [active, setActive] = useState(null);
  useEffect(() => { api("/literature/books").then((d) => setBooks(d.books || [])).catch(() => {}); }, []);
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-semibold mb-4">Literature reader</h1>
      <select className="border rounded px-3 py-2 bg-transparent" onChange={async (e) => setActive(await api("/literature/books/" + e.target.value))}>
        <option value="">Choose a book</option>
        {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>
      {active?.book && <p className="mt-4">{active.book.full_summary}</p>}
    </div>
  );
}

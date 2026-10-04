import React, { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

export default function Institutions() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  async function load(value) {
    setQ(value);
    const data = await api("/institutions?q=" + encodeURIComponent(value));
    setRows(data.institutions || []);
  }
  useEffect(() => { load("").catch(() => setRows([])); }, []);
  return (
    <Shell title="School finder" back="/">
      <input value={q} onChange={(e) => load(e.target.value)} placeholder="School or course" className="w-full rounded-2xl border border-sage-200 bg-parchment px-4 py-3 mb-4" />
      {rows.map((row) => (
        <article key={row.id} className="card-soft p-4 mb-3">
          <h2 className="font-semibold">{row.course_name}</h2>
          <p className="text-sm">{row.institution_name}</p>
          <p className="text-sm text-sage-600">JAMB cut-off {row.jamb_cutoff}</p>
        </article>
      ))}
      {rows.length === 0 && <p className="text-sm text-sage-500">No school matched that search.</p>}
    </Shell>
  );
}

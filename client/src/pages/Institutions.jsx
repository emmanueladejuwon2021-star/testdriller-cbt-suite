import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
export default function Institutions() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api("/institutions").then((d) => setRows(d.institutions || [])).catch(() => {}); }, []);
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-semibold mb-4">Course and school finder</h1>
      {rows.map((row) => (
        <article key={row.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3">
          <h2 className="font-semibold">{row.course_name}</h2>
          <p className="text-sm">{row.institution_name} · JAMB {row.jamb_cutoff}</p>
        </article>
      ))}
    </div>
  );
}

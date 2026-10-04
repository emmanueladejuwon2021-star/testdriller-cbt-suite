import React, { useEffect, useState } from "react";
import Shell from "../components/Shell.jsx";
import { api } from "../utils/api.js";

export default function StudyHub() {
  const [notes, setNotes] = useState([]);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/study/notes").then((data) => setNotes(data.notes || [])).catch((err) => setError(err.message || "Notes are offline."));
  }, []);

  return (
    <Shell title="Study materials" back="/">
      {error && <p className="text-sm text-terra-700 mb-3">{error}</p>}
      {notes.length === 0 && !error && <p className="text-sm text-sage-500">No syllabus notes yet. Run the seed after migration.</p>}
      <div className="space-y-2">
        {notes.map((note) => (
          <button key={note.id} onClick={() => setOpenId(openId === note.id ? "" : note.id)} className="card-soft w-full p-4 text-left">
            <p className="text-xs text-sage-500">{note.subject_name}</p>
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{note.name}</p>
              <span>{openId === note.id ? "–" : "+"}</span>
            </div>
            {openId === note.id && <p className="mt-2 text-sm">{note.syllabus_overview || "Overview will appear when this topic is seeded."}</p>}
          </button>
        ))}
      </div>
    </Shell>
  );
}

import React, { useMemo, useState } from "react";
export default function Corrections() {
  const result = useMemo(() => JSON.parse(sessionStorage.getItem("cbt_result") || "null"), []);
  const [filter, setFilter] = useState("all");
  if (!result) return <p className="p-8">No corrections to show.</p>;
  const rows = (result.logs || []).filter((log) => filter === "wrong" ? !log.is_correct : filter === "bookmarked" ? log.was_bookmarked : true);
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Corrections workspace</h1>
        <div className="flex gap-2"><button onClick={() => setFilter("all")}>All</button><button onClick={() => setFilter("wrong")}>Wrong only</button><button onClick={() => setFilter("bookmarked")}>Bookmarked</button></div>
        {rows.map((log) => (
          <article key={log.question_id} className="bg-white dark:bg-slate-900 rounded-xl p-4">
            <p>{log.question?.question_text}</p>
            <p>Your choice: {log.user_selected_option || "blank"}</p>
            <p>Correct choice: {log.correct_option}</p>
            <p className="text-sm text-slate-500">{log.question?.detailed_explanation}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

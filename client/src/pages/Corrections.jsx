import React, { useMemo, useState } from "react";
import Shell from "../components/Shell.jsx";
export default function Corrections() {
  const result = useMemo(() => JSON.parse(sessionStorage.getItem("cbt_result") || "null"), []);
  const [filter, setFilter] = useState("all");
  if (!result) return <Shell title="Corrections Hub" back="/results"><p>No corrections yet.</p></Shell>;
  const rows = (result.logs || []).filter((log) => filter === "wrong" ? !log.is_correct : true);
  return (
    <Shell title="Corrections Hub" back="/results">
      <div className="flex gap-2 mb-3">
        <button onClick={() => setFilter("all")} className="chip bg-parchment">All</button>
        <button onClick={() => setFilter("wrong")} className="chip bg-parchment">Wrong</button>
      </div>
      {rows.map((log, i) => (
        <article key={log.question_id} className="card-soft p-4 mb-3">
          <p className="text-xs text-sage-500">Question {i + 1}</p>
          <p className="font-medium mt-1">{log.question?.question_text}</p>
          <p className="text-sm mt-2">Your answer {log.user_selected_option || "blank"}</p>
          <p className="text-sm text-sage-700">Key: {log.correct_option}</p>
        </article>
      ))}
    </Shell>
  );
}

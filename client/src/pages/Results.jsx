import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell.jsx";
export default function Results() {
  const result = useMemo(() => JSON.parse(sessionStorage.getItem("cbt_result") || "null"), []);
  if (!result) return <Shell title="Results" back="/"><p>No saved result.</p></Shell>;
  const remark = result.percentage >= 70 ? "Good" : "Keep going";
  const bars = [40, 55, 48, 72, 68, Math.round(result.percentage)];
  return (
    <Shell title="Results" back="/">
      <div className="card-soft p-5 mb-4">
        <p className="text-sm text-sage-500">Score</p>
        <p className="font-display text-4xl text-sage-700">{result.score}/{result.total}</p>
        <p>Percentage: {Math.round(result.percentage)}%</p>
        <p>Remark: {remark}</p>
      </div>
      <div className="card-soft p-4 mb-4">
        <p className="font-semibold text-sage-700 mb-3">Practice score trend</p>
        <div className="flex items-end gap-2 h-28">
          {bars.map((h, i) => <div key={i} className="flex-1 bg-sage-300 rounded-t-lg" style={{ height: h + "%" }} />)}
        </div>
      </div>
      <Link to="/corrections" className="block card-soft p-4 mb-3">Correction list</Link>
    </Shell>
  );
}

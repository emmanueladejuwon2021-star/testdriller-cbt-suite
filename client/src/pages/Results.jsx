import React, { useMemo } from "react";
import { Link } from "react-router-dom";
export default function Results() {
  const result = useMemo(() => JSON.parse(sessionStorage.getItem("cbt_result") || "null"), []);
  if (!result) return <div className="p-8">No saved result. <Link className="text-blue-600" to="/setup">Start a test</Link></div>;
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto space-y-6 text-center">
        <p className="text-5xl font-bold">{result.score} / {result.total}</p>
        <p>{Math.round(result.percentage)} percent</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="bg-blue-700 text-white px-4 py-2 rounded-lg" to="/corrections">Review corrections</Link>
          <Link className="border px-4 py-2 rounded-lg" to="/setup">Retake</Link>
        </div>
      </div>
    </div>
  );
}

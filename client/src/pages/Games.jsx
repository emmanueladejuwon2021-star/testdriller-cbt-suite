import React, { useState } from "react";
export default function Games() {
  const [score, setScore] = useState(0);
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-semibold">Games arcade</h1>
      <p className="mt-4">MathsCraft: 7 × 8</p>
      <button className="mt-2 bg-blue-700 text-white px-4 py-2 rounded" onClick={() => setScore((s) => s + 10)}>I got 56</button>
      <p className="mt-2">Score {score}</p>
    </div>
  );
}

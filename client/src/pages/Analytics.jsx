import React, { useEffect, useState } from "react";
import { offlineDb } from "../db/dexie.js";
export default function Analytics() {
  const [attempts, setAttempts] = useState([]);
  useEffect(() => { offlineDb.test_attempts.toArray().then(setAttempts); }, []);
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <h1 className="text-2xl font-semibold mb-4">Performance centre</h1>
      {attempts.map((a) => <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-2 flex justify-between"><span>{a.exam_mode}</span><span>{Math.round(a.percentage || 0)}%</span></div>)}
    </div>
  );
}

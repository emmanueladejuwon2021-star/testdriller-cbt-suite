import React, { useEffect, useState } from "react";
import { offlineDb } from "../db/dexie.js";
import Shell from "../components/Shell.jsx";
export default function Analytics() {
  const [attempts, setAttempts] = useState([]);
  useEffect(() => { offlineDb.test_attempts.toArray().then(setAttempts); }, []);
  return (
    <Shell title="Performance Analysis" back="/">
      <div className="card-soft p-4 mb-4">
        <p className="font-semibold text-sage-700 mb-3">Subject score trend</p>
        <svg viewBox="0 0 200 80" className="w-full h-28">
          <path d="M0 60 C40 50, 70 20, 110 35 S170 10, 200 25" fill="none" stroke="#7A9A6A" strokeWidth="3" />
          <path d="M0 70 C40 62, 70 40, 110 48 S170 28, 200 38 L200 80 L0 80 Z" fill="#B7C9A8" opacity="0.45" />
        </svg>
      </div>
      {attempts.map((a) => (
        <div key={a.id} className="card-soft p-3 mb-2 flex justify-between">
          <span>{a.exam_mode}</span>
          <span className="text-sage-700">{Math.round(a.percentage || 0)}%</span>
        </div>
      ))}
    </Shell>
  );
}

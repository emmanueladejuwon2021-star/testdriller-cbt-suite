import React, { useState } from "react";
import { api } from "../utils/api.js";
export default function ParentPortal() {
  const [pin, setPin] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  async function openGate(e) {
    e.preventDefault();
    try { setData(await api("/parent/summary?pin=" + encodeURIComponent(pin))); }
    catch (err) { setError(err.message); }
  }
  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <form onSubmit={openGate} className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-3">
        <h1 className="text-xl font-semibold">Parent portal</h1>
        <input className="w-full border rounded px-3 py-2 bg-transparent" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="bg-blue-700 text-white rounded px-4 py-2">Unlock</button>
        {data && <p>{data.student.full_name} · {Math.round(data.student.average_score || 0)}%</p>}
      </form>
    </div>
  );
}

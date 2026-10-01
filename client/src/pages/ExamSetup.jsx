import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { offlineDb } from "../db/dexie.js";
import { useApp } from "../context/AppContext.jsx";
export default function ExamSetup() {
  const nav = useNavigate();
  const { exam } = useApp();
  const [subjects, setSubjects] = useState([]);
  const [picked, setPicked] = useState([]);
  const [count, setCount] = useState(40);
  const [minutes, setMinutes] = useState(40);
  const [mode, setMode] = useState("Exam");
  const [calculator, setCalculator] = useState(true);
  const [instant, setInstant] = useState(false);
  useEffect(() => { offlineDb.subjects.toArray().then(setSubjects); }, []);
  const maxSubjects = exam === "WAEC" ? 9 : 4;
  function toggle(id) {
    setPicked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= maxSubjects ? prev : [...prev, id]);
  }
  function start() {
    sessionStorage.setItem("cbt_setup", JSON.stringify({ exam, subjects: picked, count, minutes, mode, calculator, instant, shuffleQ: true }));
    nav("/exam");
  }
  return (
    <div className="min-h-screen p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Exam setup</h1>
        {subjects.map((s) => (
          <label key={s.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg p-3">
            <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} /> {s.name}
          </label>
        ))}
        <p>Questions {count}</p>
        <input type="range" min="10" max="180" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full" />
        <p>Minutes {minutes}</p>
        <input type="range" min="10" max="180" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full" />
        <label><input type="checkbox" checked={calculator} onChange={(e) => setCalculator(e.target.checked)} /> Calculator</label>
        <div className="flex gap-2">{["Exam","Practice","Mock"].map((m) => <button key={m} onClick={() => setMode(m)} className="border rounded px-3 py-2">{m}</button>)}</div>
        <button disabled={!picked.length} onClick={start} className="bg-blue-700 text-white px-6 py-3 rounded-xl disabled:opacity-40">Enter exam room</button>
      </div>
    </div>
  );
}

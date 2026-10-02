import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { offlineDb } from "../db/dexie.js";
import { useApp } from "../context/AppContext.jsx";
import Shell from "../components/Shell.jsx";
export default function ExamSetup() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { exam, exams, setExam } = useApp();
  const [subjects, setSubjects] = useState([]);
  const [picked, setPicked] = useState([]);
  const [count, setCount] = useState(40);
  const [minutes, setMinutes] = useState(40);
  const [mode, setMode] = useState("Practice");
  const [calculator, setCalculator] = useState(true);
  useEffect(() => {
    offlineDb.subjects.toArray().then((rows) => {
      setSubjects(rows);
      const wanted = (params.get("subject") || "").toLowerCase();
      if (!wanted) return;
      const match = rows.find((s) => s.name.toLowerCase().includes(wanted) || s.code?.toLowerCase() === wanted);
      if (match) setPicked([match.id]);
    });
  }, [params]);
  const maxSubjects = exam === "WAEC" ? 9 : 4;
  function toggle(id) {
    setPicked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= maxSubjects ? prev : [...prev, id]);
  }
  function start() {
    sessionStorage.setItem("cbt_setup", JSON.stringify({ exam, subjects: picked, count, minutes, mode, calculator, instant: mode === "Practice", shuffleQ: true }));
    nav("/exam");
  }
  return (
    <Shell title="Practice Hub" back="/">
      <div className="flex gap-2 mb-4">
        {exams.slice(0, 3).map((item) => (
          <button key={item} onClick={() => setExam(item)} className={`chip ${exam === item ? "bg-sage-700 text-white" : "bg-parchment"}`}>
            {item === "JAMB" ? "UTME" : item}
          </button>
        ))}
      </div>
      <div className="card-soft p-4 mb-4">
        <p className="text-sm font-semibold text-sage-700 mb-3">Practice map</p>
        <div className="flex justify-between items-center text-xs">
          <span className="h-12 w-12 rounded-full bg-sage-500 text-white grid place-items-center">UTME</span>
          <span className="flex-1 h-px bg-sage-300 mx-2" />
          <span className="h-12 w-12 rounded-full bg-wood text-white grid place-items-center">WAEC</span>
          <span className="flex-1 h-px bg-sage-300 mx-2" />
          <span className="h-12 w-12 rounded-full bg-terra-500 text-white grid place-items-center">NECO</span>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {subjects.map((s) => (
          <label key={s.id} className={`card-soft p-3 flex items-center gap-3 ${picked.includes(s.id) ? "ring-2 ring-sage-500" : ""}`}>
            <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
            <span>{s.name}</span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="card-soft p-3 text-sm">
          Questions
          <input className="mt-1 w-full rounded-lg border px-2 py-1" type="number" min={5} max={180} value={count} onChange={(e) => setCount(Number(e.target.value) || 5)} />
        </label>
        <label className="card-soft p-3 text-sm">
          Minutes
          <input className="mt-1 w-full rounded-lg border px-2 py-1" type="number" min={5} max={180} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 5)} />
        </label>
      </div>
      <button disabled={!picked.length} onClick={start} className="w-full rounded-pill bg-sage-700 text-white py-3 font-semibold disabled:opacity-40">Start practice</button>
    </Shell>
  );
}

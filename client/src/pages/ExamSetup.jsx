import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { offlineDb } from "../db/dexie.js";
import { useApp } from "../context/AppContext.jsx";
import Shell from "../components/Shell.jsx";

const MODES = ["Practice", "Exam", "Study"];

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
  const [limitNote, setLimitNote] = useState("");
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
    setPicked((prev) => {
      if (prev.includes(id)) {
        setLimitNote("");
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= maxSubjects) {
        setLimitNote(exam === "JAMB" ? "UTME allows 4 subjects, like the real hall." : "This exam allows " + maxSubjects + " subjects.");
        return prev;
      }
      setLimitNote("");
      return [...prev, id];
    });
  }
  function applyUtmeHall() {
    setExam("JAMB");
    setMode("Exam");
    setCount(180);
    setMinutes(120);
    setCalculator(true);
    setLimitNote("Hall preset: 180 questions, 2 hours, calculator on.");
  }
  function start() {
    sessionStorage.setItem("cbt_setup", JSON.stringify({
      exam,
      subjects: picked,
      count,
      minutes,
      mode,
      calculator,
      instant: mode !== "Exam",
      shuffleQ: mode !== "Study",
    }));
    nav("/exam");
  }
  return (
    <Shell title="Practice Hub" back="/">
      <div className="flex gap-2 mb-4 overflow-auto">
        {exams.slice(0, 3).map((item) => (
          <button key={item} onClick={() => setExam(item)} className={`chip whitespace-nowrap ${exam === item ? "bg-sage-700 text-white" : "bg-parchment"}`}>
            {item === "JAMB" ? "UTME" : item}
          </button>
        ))}
      </div>
      <div className="card-soft p-4 mb-4">
        <p className="text-sm font-semibold text-sage-700 mb-3">How do you want to sit?</p>
        <div className="flex gap-2">
          {MODES.map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`chip ${mode === item ? "bg-sage-700 text-white" : "bg-parchment"}`}>{item}</button>
          ))}
        </div>
        <p className="text-xs text-sage-500 mt-2">
          {mode === "Exam" ? "Clock runs. Answers stay hidden until you submit." : mode === "Study" ? "No shuffle. The explanation shows after each pick." : "You can check the answer as you go."}
        </p>
      </div>
      <button type="button" onClick={applyUtmeHall} className="w-full card-soft p-3 mb-4 text-left">
        <p className="font-semibold text-sage-700">UTME hall preset</p>
        <p className="text-xs text-sage-500">4 subjects · 180 questions · 2 hours · exam mode</p>
      </button>
      <div className="space-y-2 mb-4">
        {subjects.length === 0 && <p className="card-soft p-3 text-sm">No subjects in the offline store yet. Start the API, then reload.</p>}
        {subjects.map((s) => (
          <label key={s.id} className={`card-soft p-3 flex items-center gap-3 ${picked.includes(s.id) ? "ring-2 ring-sage-500" : ""}`}>
            <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
            <span>{s.name}</span>
          </label>
        ))}
      </div>
      {limitNote && <p className="text-sm text-terra-700 mb-3">{limitNote}</p>}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="card-soft p-3 text-sm">
          Questions
          <input className="mt-1 w-full rounded-lg border px-2 py-1 bg-white" type="number" min={5} max={180} value={count} onChange={(e) => setCount(Math.min(180, Math.max(5, Number(e.target.value) || 5)))} />
        </label>
        <label className="card-soft p-3 text-sm">
          Minutes
          <input className="mt-1 w-full rounded-lg border px-2 py-1 bg-white" type="number" min={5} max={180} value={minutes} onChange={(e) => setMinutes(Math.min(180, Math.max(5, Number(e.target.value) || 5)))} />
        </label>
      </div>
      <label className="card-soft p-3 mb-4 flex items-center justify-between text-sm">
        <span>Built-in calculator</span>
        <input type="checkbox" checked={calculator} onChange={(e) => setCalculator(e.target.checked)} />
      </label>
      <button disabled={!picked.length} onClick={start} className="w-full rounded-pill bg-sage-700 text-white py-3 font-semibold disabled:opacity-40">Start {mode.toLowerCase()}</button>
    </Shell>
  );
}

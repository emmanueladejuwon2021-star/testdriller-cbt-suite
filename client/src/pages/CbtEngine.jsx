import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { offlineDb } from "../db/dexie.js";
import Calculator from "../components/Calculator.jsx";
import { api } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";
export default function CbtEngine() {
  const nav = useNavigate();
  const { user } = useApp();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [setup, setSetup] = useState(null);
  const [passage, setPassage] = useState(null);
  const [clockReady, setClockReady] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [fontPx, setFontPx] = useState(18);
  const startedAt = useRef(Date.now());
  const submitted = useRef(false);
  useEffect(() => {
    async function load() {
      const saved = await offlineDb.exam_sessions.get("active");
      const raw = sessionStorage.getItem("cbt_setup");
      const cfg = saved?.setup || (raw ? JSON.parse(raw) : null);
      if (!cfg) { nav("/setup"); return; }
      setSetup(cfg);
      let rows = await offlineDb.questions.toArray();
      if (cfg.subjects?.length) rows = rows.filter((q) => cfg.subjects.includes(q.subject_id));
      rows = rows.slice(0, cfg.count || 40);
      if (cfg.shuffleQ) rows = rows.sort(() => Math.random() - 0.5);
      if (saved?.questions?.length) {
        setQuestions(saved.questions);
        setAnswers(saved.answers || {});
        setFlags(saved.flags || {});
        setIndex(saved.index || 0);
        setSecondsLeft(saved.secondsLeft || cfg.minutes * 60);
        setClockReady(true);
      } else {
        setQuestions(rows);
        setSecondsLeft((cfg.minutes || 40) * 60);
        setClockReady(true);
      }
    }
    load();
  }, [nav]);
  useEffect(() => {
    if (!questions.length) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [questions.length]);
  useEffect(() => {
    if (clockReady && questions.length && secondsLeft === 0 && setup) finish(true);
  }, [secondsLeft, questions.length, setup]);
  useEffect(() => {
    if (!questions.length) return;
    offlineDb.exam_sessions.put({ id: "active", status: "Interrupted", updated_at: new Date().toISOString(), setup, questions, answers, flags, index, secondsLeft });
  }, [questions, answers, flags, index, secondsLeft, setup]);
  const current = questions[index];
  useEffect(() => {
    if (!current?.passage_id) { setPassage(null); return; }
    offlineDb.passages.get(current.passage_id).then((row) => setPassage(row || null));
  }, [current]);
  async function finish() {
    if (submitted.current) return;
    submitted.current = true;
    const logs = questions.map((q) => ({ question_id: q.id, user_selected_option: answers[q.id] || "", correct_option: q.correct_option, is_correct: answers[q.id] === q.correct_option, was_bookmarked: Boolean(flags[q.id]), question: q }));
    const score = logs.filter((x) => x.is_correct).length;
    const result = { score, total: logs.length, percentage: logs.length ? (score / logs.length) * 100 : 0, logs, setup, time_spent_seconds: Math.round((Date.now() - startedAt.current) / 1000) };
    sessionStorage.setItem("cbt_result", JSON.stringify(result));
    await offlineDb.exam_sessions.delete("active");
    try {
      if (user) await api("/attempts", { method: "POST", body: JSON.stringify({ exam_mode: setup?.mode || "Exam", exam_type: setup?.exam, subjects: setup?.subjects || [], answers: logs, status: "Completed" }) });
    } catch {}
    nav("/results");
  }
  if (!current) return <div className="p-8">No questions in the offline store. Seed the API and reload.</div>;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-800 text-white">
        <div className={secondsLeft < 300 ? "animate-pulse text-red-200 font-mono" : "font-mono"}>{mm}:{ss}</div>
        <p>Question {index + 1} of {questions.length}</p>
        <div className="flex gap-2">
          <button onClick={() => setFontPx((n) => n + 2)}>A+</button>
          <button onClick={() => setFontPx((n) => Math.max(14, n - 2))}>A-</button>
          {setup?.calculator && <button onClick={() => setShowCalc(true)}>Calc</button>}
        </div>
      </header>
      <div className="flex-1 grid lg:grid-cols-2">
        <aside className="p-4 border-r border-slate-200 dark:border-slate-800">{passage ? <p style={{ fontSize: fontPx }}>{passage.passage_body}</p> : <p className="text-slate-500">No passage for this item.</p>}</aside>
        <main className="p-4">
          <p className="mb-4" style={{ fontSize: fontPx }}>{current.question_text}</p>
          {["A","B","C","D"].map((opt) => (
            <label key={opt} className="flex gap-3 border rounded-xl p-3 mb-2">
              <input type="radio" name={current.id} checked={answers[current.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [current.id]: opt }))} />
              <span><b>{opt}.</b> {current["option_" + opt.toLowerCase()]}</span>
            </label>
          ))}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="border px-3 py-2 rounded" onClick={() => setIndex((i) => Math.max(0, i - 1))}>Previous</button>
            <button className="border px-3 py-2 rounded" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>Next</button>
            <button className="border px-3 py-2 rounded" onClick={() => setFlags((f) => ({ ...f, [current.id]: !f[current.id] }))}>Bookmark</button>
            <button className="bg-red-700 text-white px-4 py-2 rounded" onClick={() => finish()}>Submit exam</button>
          </div>
        </main>
      </div>
      <footer className="p-3 flex flex-wrap gap-1">
        {questions.map((q, i) => {
          let color = "bg-slate-300";
          if (answers[q.id]) color = "bg-emerald-500 text-white";
          if (flags[q.id]) color = "bg-yellow-400 text-slate-900";
          if (i === index) color = "bg-blue-600 text-white ring-2 ring-offset-1 ring-blue-800";
          return <button key={q.id} onClick={() => setIndex(i)} className={`palette-tile rounded text-xs ${color}`}>{i + 1}</button>;
        })}
      </footer>
      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
    </div>
  );
}

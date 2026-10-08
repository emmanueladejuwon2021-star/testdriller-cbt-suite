import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { offlineDb } from "../db/dexie.js";
import Calculator from "../components/Calculator.jsx";
import { api } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-NG";
  window.speechSynthesis.speak(utter);
}

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
  const [reveal, setReveal] = useState(false);
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
        if (saved.startedAt) startedAt.current = saved.startedAt;
      } else {
        setQuestions(rows);
        setSecondsLeft((cfg.minutes || 40) * 60);
      }
      setClockReady(true);
    }
    load();
  }, [nav]);
  useEffect(() => {
    if (!clockReady || !questions.length || setup?.mode === "Study") return undefined;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [clockReady, questions.length, setup?.mode]);
  useEffect(() => {
    if (clockReady && questions.length && secondsLeft === 0 && setup && setup.mode !== "Study") finish(true);
  }, [secondsLeft, questions.length, setup, clockReady]);
  useEffect(() => {
    if (!questions.length || !setup) return;
    offlineDb.exam_sessions.put({ id: "active", status: "Interrupted", updated_at: new Date().toISOString(), setup, questions, answers, flags, index, secondsLeft, startedAt: startedAt.current });
  }, [questions, answers, flags, index, secondsLeft, setup]);
  const current = questions[index];
  useEffect(() => {
    setReveal(false);
    if (!current?.passage_id) { setPassage(null); return; }
    offlineDb.passages.get(current.passage_id).then((row) => setPassage(row || null));
  }, [current]);
  async function finish(auto) {
    if (submitted.current) return;
    if (!auto) {
      const unanswered = questions.filter((q) => !answers[q.id]).length;
      const ok = window.confirm(unanswered ? unanswered + " questions are still blank. Submit anyway?" : "Submit this paper?");
      if (!ok) return;
    }
    submitted.current = true;
    window.speechSynthesis?.cancel();
    const logs = questions.map((q) => ({ question_id: q.id, user_selected_option: answers[q.id] || "", correct_option: q.correct_option, is_correct: answers[q.id] === q.correct_option, was_bookmarked: Boolean(flags[q.id]), question: q }));
    const score = logs.filter((x) => x.is_correct).length;
    const result = { score, total: logs.length, percentage: logs.length ? (score / logs.length) * 100 : 0, logs, setup, time_spent_seconds: Math.round((Date.now() - startedAt.current) / 1000) };
    sessionStorage.setItem("cbt_result", JSON.stringify(result));
    await offlineDb.exam_sessions.delete("active");
    try {
      if (user) await api("/attempts", { method: "POST", body: JSON.stringify({ exam_mode: setup?.mode || "Exam", exam_type: setup?.exam, subjects: setup?.subjects || [], answers: logs, status: "Completed", time_spent_seconds: result.time_spent_seconds, duration_allowed_seconds: (setup?.minutes || 0) * 60 }) });
    } catch { /* keep the local result if the API is down */ }
    nav("/results");
  }
  if (!current) return <div className="p-8">No questions in the offline store. Seed the API and reload.</div>;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const picked = answers[current.id];
  const showWhy = setup?.instant && (reveal || (picked && setup.mode === "Practice"));
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-800 text-white">
        <div className={secondsLeft < 300 && setup?.mode !== "Study" ? "animate-pulse text-red-200 font-mono" : "font-mono"}>{setup?.mode === "Study" ? "Study" : mm + ":" + ss}</div>
        <p>Question {index + 1} of {questions.length}</p>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => setFontPx((n) => Math.min(28, n + 2))} aria-label="Larger text">A+</button>
          <button type="button" onClick={() => setFontPx((n) => Math.max(14, n - 2))} aria-label="Smaller text">A−</button>
          <button type="button" onClick={() => speak((passage?.passage_body ? passage.passage_body + ". " : "") + current.question_text)}>Listen</button>
          {setup?.calculator && <button type="button" onClick={() => setShowCalc(true)}>Calc</button>}
        </div>
      </header>
      <div className={`flex-1 grid ${passage ? "lg:grid-cols-2" : ""}`}>
        {passage && <aside className="p-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800"><p style={{ fontSize: fontPx }}>{passage.passage_body}</p></aside>}
        <main className="p-4">
          <p className="mb-4" style={{ fontSize: fontPx }}>{current.question_text}</p>
          {["A", "B", "C", "D"].map((opt) => {
            const right = showWhy && current.correct_option === opt;
            const wrong = showWhy && picked === opt && picked !== current.correct_option;
            return (
              <label key={opt} className={`flex gap-3 border rounded-xl p-3 mb-2 ${right ? "border-emerald-600 bg-emerald-50" : ""} ${wrong ? "border-red-500 bg-red-50" : ""}`}>
                <input type="radio" name={current.id} checked={picked === opt} onChange={() => setAnswers((p) => ({ ...p, [current.id]: opt }))} />
                <span><b>{opt}.</b> {current["option_" + opt.toLowerCase()]}</span>
              </label>
            );
          })}
          {showWhy && <p className="text-sm mt-2 rounded-xl bg-white p-3">{current.detailed_explanation || "No explanation stored for this item."}</p>}
          {setup?.mode === "Study" && !showWhy && <button type="button" className="text-sm underline" onClick={() => setReveal(true)}>Show explanation</button>}
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" className="border px-3 py-2 rounded" onClick={() => setIndex((i) => Math.max(0, i - 1))}>Previous</button>
            <button type="button" className="border px-3 py-2 rounded" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>Next</button>
            <button type="button" className="border px-3 py-2 rounded" onClick={() => setFlags((f) => ({ ...f, [current.id]: !f[current.id] }))}>{flags[current.id] ? "Bookmarked" : "Bookmark"}</button>
            <button type="button" className="bg-red-700 text-white px-4 py-2 rounded" onClick={() => finish(false)}>Submit exam</button>
          </div>
        </main>
      </div>
      <footer className="p-3 flex flex-wrap gap-1">
        {questions.map((q, i) => {
          let color = "bg-slate-300";
          if (answers[q.id]) color = "bg-emerald-500 text-white";
          if (flags[q.id]) color = "bg-yellow-400 text-slate-900";
          if (i === index) color = "bg-blue-600 text-white ring-2 ring-offset-1 ring-blue-800";
          return <button key={q.id} type="button" onClick={() => setIndex(i)} className={`h-8 min-w-8 px-2 rounded text-xs ${color}`}>{i + 1}</button>;
        })}
      </footer>
      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
    </div>
  );
}

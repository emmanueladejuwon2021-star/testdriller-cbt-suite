import React from "react";
import { Link } from "react-router-dom";
import { Flame, Moon, Sun } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
const cards = [
  ["/setup", "Practice exam mode", "Timed paper with official subject mix"],
  ["/setup", "Practice topics", "Drill one syllabus topic"],
  ["/literature", "Literature and novels", "Summaries and chapter notes"],
  ["/study", "Video lessons and notes", "Notes, videos and flashcards"],
  ["/games", "Games arcade", "MathsCraft, Word Search, Challenge Bot"],
  ["/institutions", "Career and school finder", "Courses and cut-off marks"],
  ["/analytics", "Performance centre", "Score history"],
  ["/parent", "Parent portal", "PIN-protected report"],
];
export default function Dashboard() {
  const { user, exam, exams, setExam, dark, toggleTheme, streak, offlineNote } = useApp();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-sm text-slate-500">Hello</p>
          <p className="font-semibold">{user?.full_name || "Student (demo)"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="bg-transparent border rounded-lg px-2 py-1 text-sm">
            {exams.map((item) => <option key={item}>{item}</option>)}
          </select>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">{offlineNote}</span>
          <span className="flex items-center gap-1 text-orange-500 text-sm"><Flame size={16} /> {streak}</span>
          <button onClick={toggleTheme} className="p-2 rounded-lg border">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link to="/activate" className="text-sm text-blue-600">{user?.activation_status === "active" ? "Licensed" : "Activate"}</Link>
        </div>
      </header>
      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {cards.map(([to, title, text]) => (
          <Link key={title} to={to} className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">{text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

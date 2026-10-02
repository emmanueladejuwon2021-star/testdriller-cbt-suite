import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calculator, FlaskConical, Leaf, LineChart, PenLine, University } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import Shell from "../components/Shell.jsx";

const pathways = [
  { to: "/setup?subject=Mathematics", label: "Math", icon: Calculator, bg: "bg-[#7BA37A]", color: "text-white" },
  { to: "/setup?subject=English", label: "English", icon: PenLine, bg: "bg-[#E8B89A]", color: "text-ink" },
  { to: "/setup?subject=Chemistry", label: "Chemistry", icon: FlaskConical, bg: "bg-[#D4B36A]", color: "text-ink" },
  { to: "/setup?subject=Biology", label: "Biology", icon: Leaf, bg: "bg-[#F0E4C8]", color: "text-ink" },
];

export default function Dashboard() {
  const { user, exam, exams, setExam, streak, offlineNote } = useApp();
  const progress = Number.isFinite(Number(user?.average_score)) ? Math.round(Number(user.average_score)) : 0;
  return (
    <Shell title="TD EDU CORE">
      <section className="wood-banner text-white rounded-[1.6rem] p-5 shadow-soft mb-5">
        <p className="text-xs uppercase tracking-widest opacity-80">Progress {progress}%</p>
        <div className="flex items-end justify-between mt-2">
          <p className="font-display text-5xl leading-none">{progress}%</p>
          <div className="text-right text-sm">
            <p>Welcome back, {user?.full_name || "Student"}</p>
            <p className="opacity-80">Terracotta path</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/30">
          <div className="h-2 rounded-full bg-white" style={{ width: progress + "%" }} />
        </div>
      </section>
      <div className="flex gap-2 overflow-auto mb-5">
        {exams.map((item) => (
          <button key={item} onClick={() => setExam(item)} className={`chip whitespace-nowrap ${exam === item ? "bg-sage-700 text-white" : "bg-parchment text-sage-700"}`}>
            {item === "JAMB" ? "UTME" : item}
          </button>
        ))}
      </div>
      <section className="card-soft p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-sage-700">My pathways</h2>
          <Link to="/setup" className="text-xs text-sage-500">See all</Link>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          {pathways.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} to={p.to} className="space-y-2">
                <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center ${p.bg} ${p.color}`}><Icon size={20} /></div>
                <p className="text-xs">{p.label}</p>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="card-soft p-4 mb-5">
        <h2 className="font-semibold text-sage-700 mb-2">Today’s exploration</h2>
        <p className="text-sm">Recent actions · {offlineNote}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/study" className="card-soft p-4"><BookOpen className="text-sage-700 mb-2" /><p className="font-semibold">Study materials</p></Link>
        <Link to="/analytics" className="card-soft p-4"><LineChart className="text-terra-700 mb-2" /><p className="font-semibold">Performance</p></Link>
        <Link to="/institutions" className="card-soft p-4"><University className="text-wood mb-2" /><p className="font-semibold">School finder</p></Link>
        <Link to="/parent" className="card-soft p-4"><p className="font-semibold">Parent portal</p></Link>
      </div>
    </Shell>
  );
}

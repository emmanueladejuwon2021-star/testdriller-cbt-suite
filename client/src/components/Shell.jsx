import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, LineChart, Moon, PlayCircle, Settings, Sun, User } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/setup", label: "Practice", icon: PlayCircle },
  { to: "/study", label: "Notes", icon: BookOpen },
  { to: "/analytics", label: "Stats", icon: LineChart },
  { to: "/activate", label: "Key", icon: Settings },
];

export default function Shell({ title, back, children, hideNav = false }) {
  const loc = useLocation();
  const { dark, toggleTheme } = useApp();
  return (
    <div className="min-h-screen organic-bg text-ink">
      <div className="max-w-3xl mx-auto min-h-screen px-4 pb-28 pt-4">
        <header className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {back && (
              <Link to={back} className="h-9 w-9 grid place-items-center rounded-full bg-parchment shadow-soft shrink-0">‹</Link>
            )}
            <h1 className="font-display text-2xl text-sage-700 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="h-9 w-9 grid place-items-center rounded-full bg-parchment shadow-soft">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/activate" className="h-9 w-9 grid place-items-center rounded-full bg-parchment shadow-soft">
              <User size={16} />
            </Link>
          </div>
        </header>
        {children}
      </div>
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0">
          <div className="max-w-3xl mx-auto m-3 mb-4 rounded-pill bg-parchment shadow-soft flex justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const on = loc.pathname === tab.to;
              return (
                <Link key={tab.to} to={tab.to} className={`flex flex-col items-center text-[10px] ${on ? "text-sage-700" : "text-sage-500"}`}>
                  <Icon size={18} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function LogoMark({ size = "md" }) {
  const box = size === "lg" ? "h-20 w-20 text-3xl" : "h-12 w-12 text-xl";
  return (
    <div className={`${box} rounded-full bg-sage-100 grid place-items-center text-sage-700 shadow-soft`}>
      <span className="font-display">A</span>
    </div>
  );
}

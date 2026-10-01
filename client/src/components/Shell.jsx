import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, LineChart, PlayCircle, Settings, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/setup", label: "Practice", icon: PlayCircle },
  { to: "/study", label: "Notes", icon: BookOpen },
  { to: "/analytics", label: "Stats", icon: LineChart },
  { to: "/activate", label: "Key", icon: Settings },
];

export default function Shell({ title, back, children, hideNav = false }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen organic-bg text-ink">
      <div className="max-w-md mx-auto min-h-screen px-4 pb-24 pt-4">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {back && (
              <Link to={back} className="h-9 w-9 grid place-items-center rounded-full bg-parchment shadow-soft">‹</Link>
            )}
            <h1 className="font-display text-2xl text-sage-700">{title}</h1>
          </div>
          <Link to="/activate" className="h-9 w-9 grid place-items-center rounded-full bg-parchment shadow-soft">
            <User size={16} />
          </Link>
        </header>
        {children}
      </div>
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0">
          <div className="max-w-md mx-auto m-3 rounded-pill bg-parchment shadow-soft flex justify-around py-2">
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

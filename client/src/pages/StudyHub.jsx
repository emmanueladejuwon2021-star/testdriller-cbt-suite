import React from "react";
import Shell from "../components/Shell.jsx";
export default function StudyHub() {
  return (
    <Shell title="Study Materials" back="/">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-soft p-4 text-center"><div className="h-16 rounded-xl bg-terra-400/30 grid place-items-center text-2xl">📘</div><p className="mt-2 font-semibold">English</p></div>
        <div className="card-soft p-4 text-center"><div className="h-16 rounded-xl bg-sage-300/50 grid place-items-center text-2xl">⚗️</div><p className="mt-2 font-semibold">Chemistry</p></div>
      </div>
      <div className="card-soft p-3 mb-2 flex justify-between"><span>Chapter 1</span><span>›</span></div>
      <div className="card-soft p-3 mb-2 flex justify-between"><span>Chapter 2</span><span>›</span></div>
    </Shell>
  );
}

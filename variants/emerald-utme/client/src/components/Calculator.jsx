import { useState } from "react";

export default function Calculator({ onClose }) {
  const [expr, setExpr] = useState("");
  const [out, setOut] = useState("0");
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "+", "C", "\u232b", "="];
  function press(k) {
    if (k === "C") { setExpr(""); setOut("0"); return; }
    if (k === "\u232b") { setExpr((e) => e.slice(0, -1)); return; }
    if (k === "=") {
      try {
        if (!/^[-+*/().\d\s]+$/.test(expr)) throw new Error("bad");
        const value = Function(`"use strict"; return (${expr})`)();
        setOut(String(Math.round(value * 1e6) / 1e6));
      } catch { setOut("Error"); }
      return;
    }
    setExpr((e) => e + k);
  }
  return (
    <div className="absolute right-4 top-16 z-30 w-64 rounded-lg border border-line bg-panel p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-emerald">
        <span>Calculator</span>
        <button onClick={onClose} className="text-slate-300">close</button>
      </div>
      <div className="mb-2 rounded bg-ink px-2 py-2 text-right">
        <div className="truncate text-xs text-slate-400">{expr || " "}</div>
        <div className="text-lg font-semibold text-amberx">{out}</div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)} className="rounded bg-slateblue/40 py-2 text-sm hover:bg-emerald/30">{k}</button>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from "react";
const keys = ["C","DEL","/","*","7","8","9","-","4","5","6","+","1","2","3","=","0",".","sin","sqrt"];
export default function Calculator({ onClose }) {
  const [expr, setExpr] = useState("");
  function apply(key) {
    if (key === "C") return setExpr("");
    if (key === "DEL") return setExpr((s) => s.slice(0, -1));
    if (key === "=") {
      try {
        const s = expr.replace(/sin/g, "Math.sin").replace(/sqrt/g, "Math.sqrt");
        setExpr(String(Function("return (" + s + ")")()));
      } catch { setExpr("Error"); }
      return;
    }
    setExpr((s) => s + key);
  }
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-80">
        <div className="flex justify-between mb-2"><p className="font-semibold">Calculator</p><button onClick={onClose}>Close</button></div>
        <div className="border rounded-lg p-2 mb-3 min-h-10">{expr || "0"}</div>
        <div className="grid grid-cols-4 gap-2">{keys.map((k) => <button key={k} onClick={() => apply(k)} className="border rounded py-2">{k}</button>)}</div>
      </div>
    </div>
  );
}

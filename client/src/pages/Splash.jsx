import React from "react";
export default function Splash({ note }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600 animate-pulse grid place-items-center text-2xl font-bold">CBT</div>
        <h1 className="text-2xl font-semibold">Exam Suite</h1>
        <p className="text-slate-300 text-sm">{note || "Starting offline database..."}</p>
        <p className="text-slate-500 text-xs">Version 1.0.0</p>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "../components/Shell.jsx";
export default function Splash({ note }) {
  return (
    <div className="min-h-screen organic-bg grid place-items-center p-6">
      <div className="max-w-sm w-full card-soft overflow-hidden text-center">
        <div className="h-40 relative">
          <div className="absolute -left-6 -top-8 h-32 w-32 rounded-full bg-terra-400/40" />
          <div className="absolute right-4 top-6 h-24 w-24 rounded-full bg-sage-300/70" />
          <div className="absolute inset-0 grid place-items-center"><LogoMark size="lg" /></div>
        </div>
        <div className="px-6 pb-8">
          <p className="text-xs tracking-[0.2em] text-sage-500">TD EDU CORE</p>
          <h1 className="font-display text-3xl text-sage-700 mt-1">Welcome to TD EDU CORE</h1>
          <p className="text-sm text-sage-700/70 mt-2">Begin your journey</p>
          <p className="text-xs text-sage-500 mt-4">{note || "Preparing your offline library..."}</p>
          <Link to="/" className="mt-6 inline-block chip bg-sage-700 text-white px-6 py-2">Enter dashboard</Link>
        </div>
      </div>
    </div>
  );
}

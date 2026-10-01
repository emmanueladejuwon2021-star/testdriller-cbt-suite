import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api, hyphenateKey } from "../utils/api.js";
import Shell, { LogoMark } from "../components/Shell.jsx";
export default function Activate() {
  const nav = useNavigate();
  const { setSessionUser } = useApp();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  async function redeem(e) {
    e.preventDefault();
    try {
      if (name) {
        const created = await api("/users/register", { method: "POST", body: JSON.stringify({ full_name: name, email, target_exam: "JAMB" }) });
        await setSessionUser(created.user, created.token);
      }
      if (key) {
        const data = await api("/activation/redeem", { method: "POST", body: JSON.stringify({ key_code: key, device_fingerprint: navigator.userAgent.slice(0, 80) }) });
        await setSessionUser(data.user, data.token);
      }
      nav("/");
    } catch (err) { setError(err.message); }
  }
  return (
    <Shell title="Help & Activate" back="/">
      <div className="card-soft p-5 space-y-4">
        <div className="flex justify-center"><LogoMark /></div>
        <h2 className="text-center font-display text-2xl text-sage-700">Welcome back</h2>
        <form onSubmit={redeem} className="space-y-3">
          <input className="w-full rounded-pill bg-cream px-4 py-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded-pill bg-cream px-4 py-3" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-pill bg-cream px-4 py-3 tracking-[0.15em] uppercase" placeholder="JOURNEY KEY" value={key} onChange={(e) => setKey(hyphenateKey(e.target.value))} />
          {error && <p className="text-terra-700 text-sm">{error}</p>}
          <button className="w-full rounded-pill bg-sage-700 text-white py-3 font-semibold">Login / Activate</button>
        </form>
        <button className="w-full text-sm text-sage-700" onClick={() => nav("/")}>Continue in demo mode</button>
      </div>
    </Shell>
  );
}

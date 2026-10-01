import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { api, hyphenateKey } from "../utils/api.js";
export default function Activate() {
  const nav = useNavigate();
  const { setSessionUser } = useApp();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  async function redeem(e) {
    e.preventDefault();
    try {
      if (name) {
        const created = await api("/users/register", { method: "POST", body: JSON.stringify({ full_name: name, target_exam: "JAMB" }) });
        await setSessionUser(created.user, created.token);
      }
      const data = await api("/activation/redeem", { method: "POST", body: JSON.stringify({ key_code: key, device_fingerprint: navigator.userAgent.slice(0, 80) }) });
      await setSessionUser(data.user, data.token);
      nav("/");
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="min-h-screen p-6 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white">
      <form onSubmit={redeem} className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-3">
        <h1 className="text-xl font-semibold">Activate license</h1>
        <input className="w-full border rounded-lg px-3 py-2 bg-transparent" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 uppercase bg-transparent" placeholder="XXXX-XXXX-XXXX-XXXX" value={key} onChange={(e) => setKey(hyphenateKey(e.target.value))} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-blue-700 text-white rounded-lg py-2">Activate</button>
        <button type="button" className="text-blue-600" onClick={() => nav("/")}>Continue in demo mode</button>
      </form>
    </div>
  );
}

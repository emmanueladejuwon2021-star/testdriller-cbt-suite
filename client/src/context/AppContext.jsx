import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { offlineDb, pullCloudIntoOffline, readSetting, saveSetting } from "../db/dexie";
import { api } from "../utils/api";
const AppContext = createContext(null);
const EXAMS = ["JAMB", "WAEC", "POST-UTME", "BECE", "NCEE"];
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [exam, setExam] = useState("JAMB");
  const [dark, setDark] = useState(false);
  const [streak, setStreak] = useState(1);
  const [offlineNote, setOfflineNote] = useState("Preparing offline store...");
  useEffect(() => {
    async function boot() {
      const savedTheme = await readSetting("dark", false);
      const savedExam = await readSetting("exam", "JAMB");
      const savedUser = await readSetting("user", null);
      setDark(Boolean(savedTheme));
      setExam(savedExam);
      setUser(savedUser);
      document.documentElement.classList.toggle("dark", Boolean(savedTheme));
      try {
        await pullCloudIntoOffline(import.meta.env.VITE_API_URL || "/api", localStorage.getItem("cbt_token"));
        setOfflineNote("OFFLINE MODE READY");
      } catch {
        const count = await offlineDb.questions.count();
        setOfflineNote(count ? "OFFLINE MODE READY" : "Offline store empty — start the API to sync");
      }
      setReady(true);
    }
    boot();
  }, []);
  const value = useMemo(() => ({
    ready, user, exam, exams: EXAMS, dark, streak, offlineNote,
    setExam: async (next) => { setExam(next); await saveSetting("exam", next); },
    toggleTheme: async () => {
      const next = !dark;
      setDark(next);
      document.documentElement.classList.toggle("dark", next);
      await saveSetting("dark", next);
    },
    setSessionUser: async (nextUser, token) => {
      setUser(nextUser);
      await saveSetting("user", nextUser);
      if (token) localStorage.setItem("cbt_token", token);
    },
  }), [ready, user, exam, dark, streak, offlineNote]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { return useContext(AppContext); }

import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import Splash from "./pages/Splash.jsx";
import Activate from "./pages/Activate.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ExamSetup from "./pages/ExamSetup.jsx";
import CbtEngine from "./pages/CbtEngine.jsx";
import Results from "./pages/Results.jsx";
import Corrections from "./pages/Corrections.jsx";
import Literature from "./pages/Literature.jsx";
import Games from "./pages/Games.jsx";
import Institutions from "./pages/Institutions.jsx";
import ParentPortal from "./pages/ParentPortal.jsx";
import Analytics from "./pages/Analytics.jsx";
import StudyHub from "./pages/StudyHub.jsx";

export default function App() {
  const app = useApp();
  if (!app.ready) return <Splash note={app.offlineNote} />;
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/setup" element={<ExamSetup />} />
      <Route path="/exam" element={<CbtEngine />} />
      <Route path="/results" element={<Results />} />
      <Route path="/corrections" element={<Corrections />} />
      <Route path="/literature" element={<Literature />} />
      <Route path="/games" element={<Games />} />
      <Route path="/institutions" element={<Institutions />} />
      <Route path="/parent" element={<ParentPortal />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

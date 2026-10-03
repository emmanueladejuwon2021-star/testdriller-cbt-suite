import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import ExamRoom from "./pages/ExamRoom";
import Results from "./pages/Results";
import Profile from "./pages/Profile";

function Guard({ children }) {
  const token = useSelector((s) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      <Route path="/setup" element={<Guard><Setup /></Guard>} />
      <Route path="/exam/:id" element={<Guard><ExamRoom /></Guard>} />
      <Route path="/results/:id" element={<Guard><Results /></Guard>} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

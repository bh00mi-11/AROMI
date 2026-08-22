import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Children from "./pages/Children";
import CaseDetails from "./pages/CaseDetails";
import GrowthTracker from "./pages/GrowthTracker";
import ActivityPlanner from "./pages/ActivityPlanner";
import MPRGenerator from "./pages/MPRGenerator";
import VoiceAgent from "./pages/VoiceAgent";
import RAGQuery from "./pages/RAGQuery";
import AgentPipeline from "./pages/AgentPipeline";
import PhotoCheck from "./pages/PhotoCheck";
import Attendance from "./pages/Attendance";
import SmartVisits from "./pages/SmartVisits";
import Layout from "./components/Layout";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { worker, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-primary text-lg font-semibold animate-pulse">AROMI लोड हो रहा है...</div>
    </div>
  );
  return worker ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="children" element={<Children />} />
            <Route path="children/:id" element={<CaseDetails />} />
            <Route path="cases/:id" element={<CaseDetails />} />
            <Route path="growth" element={<GrowthTracker />} />
            <Route path="activity" element={<ActivityPlanner />} />
            <Route path="mpr" element={<MPRGenerator />} />
            <Route path="voice" element={<VoiceAgent />} />
            <Route path="rag" element={<RAGQuery />} />
            <Route path="agent" element={<AgentPipeline />} />
            <Route path="photo" element={<PhotoCheck />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="visits" element={<SmartVisits />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

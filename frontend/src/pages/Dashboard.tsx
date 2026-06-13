import { useEffect, useState } from "react";
import { dashboardAPI } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Activity, Users, FileText, Mic, BookOpen, Cpu, Camera, Map } from "lucide-react";

interface Stats {
  total_children: number;
  present_today: number;
  mam_count: number;
  sam_count: number;
  normal_count: number;
  visits_due_today: number;
  worker_hours_saved: number;
  reports_automated_pct: number;
}

export default function Dashboard() {
  const { worker } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    dashboardAPI.stats().then((r) => setStats(r.data)).catch(() => {
      // Demo fallback
      setStats({
        total_children: 8, present_today: 6, mam_count: 3,
        sam_count: 1, normal_count: 4, visits_due_today: 2,
        worker_hours_saved: 6.0, reports_automated_pct: 97,
      });
    });
  }, []);

  const today = new Date().toLocaleDateString("hi-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-4 space-y-4">
      {/* Date + greeting */}
      <div>
        <div className="text-gray-400 text-xs">{today}</div>
        <div className="font-bold text-gray-800">नमस्ते, {worker?.name?.split(" ")[0]} जी 👋</div>
        <div className="text-xs text-gray-500">{worker?.centre_name}</div>
      </div>

      {/* Impact strip */}
      {stats && (
        <div className="bg-primary-light border border-orange-200 rounded-xl p-3 grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{stats.worker_hours_saved}h</div>
            <div className="text-[10px] text-gray-600">घंटे बचाए</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{stats.reports_automated_pct}%</div>
            <div className="text-[10px] text-gray-600">रिपोर्ट स्वचालित</div>
          </div>
        </div>
      )}

      {/* Today's children stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "कुल बच्चे", val: stats.total_children, color: "text-gray-700" },
            { label: "उपस्थित", val: stats.present_today, color: "text-green-600" },
            { label: "MAM", val: stats.mam_count, color: "text-yellow-600" },
            { label: "SAM", val: stats.sam_count, color: "text-red-600" },
          ].map(({ label, val, color }) => (
            <div key={label} className="card text-center py-3">
              <div className={`text-2xl font-bold ${color}`}>{val}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main action buttons */}
      <button
        onClick={() => navigate("/activity")}
        className="w-full bg-primary text-white rounded-xl p-4 flex items-center gap-3 active:scale-95 transition-transform"
      >
        <Activity size={24} />
        <div className="text-left">
          <div className="font-bold">आज की गतिविधि</div>
          <div className="text-xs text-orange-100">AI से नई गतिविधि बनाएं</div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/voice")}
          className="bg-purple-500 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <Mic size={22} />
          <div className="text-sm font-semibold">आवाज़ एजेंट</div>
          <div className="text-[10px] text-purple-100">हिंदी में बोलें</div>
        </button>
        <button onClick={() => navigate("/photo")}
          className="bg-blue-500 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <Camera size={22} />
          <div className="text-sm font-semibold">फ़ोटो जांच</div>
          <div className="text-[10px] text-blue-100">MAM/SAM पहचान</div>
        </button>
        <button onClick={() => navigate("/mpr")}
          className="bg-green-500 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <FileText size={22} />
          <div className="text-sm font-semibold">MPR बनाओ</div>
          <div className="text-[10px] text-green-100">इस महीने की रिपोर्ट</div>
        </button>
        <button onClick={() => navigate("/rag")}
          className="bg-teal-500 text-white rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <BookOpen size={22} />
          <div className="text-sm font-semibold">WHO जानकारी</div>
          <div className="text-[10px] text-teal-100">दिशानिर्देश</div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/children")}
          className="card flex items-center gap-3 active:scale-95 transition-transform">
          <Users size={20} className="text-primary" />
          <div>
            <div className="font-semibold text-sm">बच्चे</div>
            <div className="text-[10px] text-gray-400">उपस्थिति दर्ज करें</div>
          </div>
        </button>
        <button onClick={() => navigate("/agent")}
          className="card flex items-center gap-3 active:scale-95 transition-transform">
          <Cpu size={20} className="text-primary" />
          <div>
            <div className="font-semibold text-sm">AI पाइपलाइन</div>
            <div className="text-[10px] text-gray-400">एजेंट स्थिति</div>
          </div>
        </button>
      </div>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  Home, Users, Activity, FileText, Mic, BookOpen, Cpu, LogOut,
  TrendingUp, CheckSquare, MapPin
} from "lucide-react";
import { useState, useEffect } from "react";
import SyncBadge from "./SyncBadge";

const navItems = [
  { to: "/",           icon: Home,        label: "डैशबोर्ड" },
  { to: "/children",   icon: Users,       label: "बच्चे"     },
  { to: "/growth",     icon: TrendingUp,  label: "विकास"     },
  { to: "/attendance", icon: CheckSquare, label: "उपस्थिति"  },
  { to: "/visits",     icon: MapPin,      label: "भेंट"       },
  { to: "/activity",  icon: Activity,    label: "गतिविधि"   },
  { to: "/mpr",        icon: FileText,    label: "MPR"        },
  { to: "/voice",      icon: Mic,         label: "आवाज़"      },
  { to: "/rag",        icon: BookOpen,    label: "जानकारी"   },
  { to: "/agent",      icon: Cpu,         label: "AI पाइप"   },
];

export default function Layout() {
  const { worker, logout } = useAuth();
  const navigate = useNavigate();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-lg">
      {/* Offline banner */}
      {offline && (
        <div className="offline-bar">
          📵 ऑफ़लाइन मोड — डेटा सिंक होगा
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="font-bold text-lg">AROMI</div>
          <div className="text-xs text-orange-100">{worker?.centre_name || "केंद्र"}</div>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge />
          <span className="text-xs text-orange-100">{worker?.name}</span>
          <button onClick={() => { logout(); navigate("/login"); }} className="p-1 hover:bg-orange-600 rounded">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav — scrollable for 10 items */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-10">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 gap-0.5 text-center transition-colors min-w-[56px] ${
                    isActive ? "text-primary" : "text-gray-400"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[9px] leading-tight whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

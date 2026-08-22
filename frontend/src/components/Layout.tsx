import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  Home, Users, Activity, FileText, Mic, BookOpen, Cpu, LogOut,
  TrendingUp, CheckSquare, MapPin, Camera
} from "lucide-react";
import { useState, useEffect } from "react";
import SyncBadge from "./SyncBadge";
import Sidebar from "./Sidebar";

const navItems = [
  { to: "/",           icon: Home,        label: "डैशबोर्ड" },
  { to: "/children",   icon: Users,       label: "बच्चे"     },
  { to: "/growth",     icon: TrendingUp,  label: "विकास"     },
  { to: "/attendance", icon: CheckSquare, label: "उपस्थिति"  },
  { to: "/visits",     icon: MapPin,      label: "भेंट"       },
  { to: "/activity",  icon: Activity,    label: "गतिविधि"   },
  { to: "/mpr",        icon: FileText,    label: "MPR"        },
  { to: "/photo",      icon: Camera,      label: "फ़ोटो"      },
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
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row w-full text-text-main">
      {/* Offline banner */}
      {offline && (
        <div className="offline-bar fixed top-0 left-0 right-0 z-50 shadow-xs" role="alert">
          📵 ऑफ़लाइन मोड — डेटा स्थानीय रूप से सुरक्षित है और सिंक होगा
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Mobile Sticky Top Header */}
      <header className="md:hidden bg-primary-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div>
          <div className="font-bold text-lg leading-tight tracking-tight">AROMI</div>
          <div className="text-xs text-slate-200">{worker?.centre_name || "केंद्र"}</div>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge />
          <span className="text-xs text-slate-200 font-medium">{worker?.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-1.5 hover:bg-gov-blue rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="लॉगआउट"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 bg-white border-b border-border-subtle sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-text-main">
              केंद्र: <span className="text-primary-navy font-bold">{worker?.centre_name || "आंगनवाड़ी केंद्र"}</span>
            </div>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-border-subtle"></span>
            <div className="text-xs text-slate-600 font-medium">
              AROMI एकीकृत बाल विकास सेवा (ICDS) प्रशासनिक पोर्टल
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncBadge />
            <div className="h-4 w-px bg-border-subtle"></div>
            <div className="flex items-center gap-2 text-sm text-text-main">
              <div className="w-7 h-7 rounded-full bg-primary-navy/10 text-primary-navy flex items-center justify-center font-bold text-xs uppercase">
                {worker?.name ? worker.name.charAt(0) : "A"}
              </div>
              <span className="font-semibold text-xs text-text-main">{worker?.name}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-danger-red px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-danger-red"
              title="लॉगआउट"
              aria-label="Logout from system"
            >
              <LogOut size={14} />
              <span>लॉगआउट</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 w-full max-w-7xl mx-auto" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation — Scrollable */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-border-subtle z-30 shadow-xs">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 gap-0.5 text-center transition-colors min-w-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gov-blue ${
                    isActive ? "text-primary-navy font-bold" : "text-slate-500 hover:text-text-main"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

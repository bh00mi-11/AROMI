import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  Home, Users, TrendingUp, CheckSquare, MapPin,
  Activity, FileText, Camera, Mic, BookOpen, Cpu, LogOut, ShieldCheck,
  LucideIcon
} from "lucide-react";
import SyncBadge from "./SyncBadge";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  enLabel: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "मुख्य मॉड्यूल (Core)",
    items: [
      { to: "/",           icon: Home,        label: "डैशबोर्ड",    enLabel: "Dashboard"       },
      { to: "/children",   icon: Users,       label: "बच्चे",        enLabel: "Children Records" },
      { to: "/growth",     icon: TrendingUp,  label: "विकास ट्रैकर", enLabel: "Growth Tracker"   },
      { to: "/attendance", icon: CheckSquare, label: "उपस्थिति",    enLabel: "Attendance"       },
      { to: "/visits",     icon: MapPin,      label: "गृह भेंट",      enLabel: "Home Visits"      },
    ],
  },
  {
    title: "रिपोर्ट व योजना (Operations)",
    items: [
      { to: "/activity",  icon: Activity,    label: "गतिविधि",     enLabel: "Activity Planner" },
      { to: "/mpr",        icon: FileText,    label: "MPR रिपोर्ट",  enLabel: "Monthly Report"   },
      { to: "/photo",      icon: Camera,      label: "फ़ोटो जांच",   enLabel: "Photo Nutrition"  },
    ],
  },
  {
    title: "AI व सहायता (AI Intelligence)",
    items: [
      { to: "/voice",      icon: Mic,         label: "आवाज़ एजेंट",  enLabel: "Voice Assistant"  },
      { to: "/rag",        icon: BookOpen,    label: "जानकारी",     enLabel: "Knowledge Base"   },
      { to: "/agent",      icon: Cpu,         label: "AI पाइपलाइन", enLabel: "Agent Pipeline"   },
    ],
  },
];

export default function Sidebar() {
  const { worker, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:flex-col w-64 lg:w-72 bg-white border-r border-border-subtle h-screen sticky top-0 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border-subtle flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-navy flex items-center justify-center text-white shadow-2xs">
          <ShieldCheck size={22} className="stroke-[2.5]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight text-text-main">AROMI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-navy/10 text-primary-navy border border-primary-navy/20">
              Portal
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {worker?.centre_name || "आंगनवाड़ी केंद्र"}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, enLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                      isActive
                        ? "bg-gov-blue/10 text-primary-navy font-semibold shadow-2xs border-l-4 border-primary-navy pl-2"
                        : "text-gray-600 hover:text-text-main hover:bg-bg-base"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={19}
                        className={`transition-colors ${
                          isActive
                            ? "text-primary-navy"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0 flex items-baseline justify-between gap-1">
                        <span className="truncate">{label}</span>
                        <span
                          className={`text-[11px] font-normal truncate hidden lg:inline ${
                            isActive ? "text-gov-blue" : "text-gray-400"
                          }`}
                        >
                          {enLabel}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User & Sync Footer */}
      <div className="p-3 border-t border-border-subtle bg-bg-base/70">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-medium text-gray-500">सिंक स्थिति</span>
          <SyncBadge />
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-border-subtle shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-navy/10 text-primary-navy flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {worker?.name ? worker.name.charAt(0) : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-text-main truncate">
                {worker?.name || "कार्यकर्ता"}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {worker?.centre_name || "आंगनवाड़ी"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="लॉगआउट"
            aria-label="Logout"
            className="p-1.5 text-gray-400 hover:text-danger-red hover:bg-red-50 rounded-md transition-colors shrink-0 ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

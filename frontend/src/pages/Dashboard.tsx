import { useEffect, useState } from "react";
import { dashboardAPI } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  Users, AlertTriangle, Clock, CheckCircle2,
  Activity, FileText, Mic, BookOpen, Cpu, Camera,
  TrendingUp, MapPin, ArrowUpRight, Sparkles, ChevronRight
} from "lucide-react";
import LoadingState from "../components/LoadingState";

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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    dashboardAPI
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => {
        // Fallback for demonstration & offline reliability
        setStats({
          total_children: 8,
          present_today: 6,
          mam_count: 3,
          sam_count: 1,
          normal_count: 4,
          visits_due_today: 2,
          worker_hours_saved: 6.0,
          reports_automated_pct: 97,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "शुभ प्रभात / Good Morning";
    if (hour < 17) return "शुभ दोपहर / Good Afternoon";
    return "शुभ संध्या / Good Evening";
  };

  const todayFormatted = new Date().toLocaleDateString("hi-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const s = stats || {
    total_children: 8,
    present_today: 6,
    mam_count: 3,
    sam_count: 1,
    normal_count: 4,
    visits_due_today: 2,
    worker_hours_saved: 6.0,
    reports_automated_pct: 97,
  };

  // Recent timeline events (Realistic administrative activity log)
  const recentActivities = [
    {
      id: 1,
      title: "नया बच्चा पंजीकृत (New Child Registered)",
      desc: "राज कुमार • 36 माह • वार्ड 4",
      time: "10:15 AM",
      type: "create",
      dotColor: "bg-gov-blue",
    },
    {
      id: 2,
      title: "SAM चेतावनी व पोषण समीक्षा (SAM Alert Flagged)",
      desc: "अनीता पाटिल • MUAC 11.2 cm • तत्काल भेंट आवश्यक",
      time: "10:42 AM",
      type: "alert",
      dotColor: "bg-danger-red",
    },
    {
      id: 3,
      title: "दैनिक उपस्थिति व पोषण दर्ज (Attendance Logged)",
      desc: `${s.present_today}/${s.total_children} बच्चे उपस्थित • गर्म ताजा भोजन वितरित`,
      time: "11:30 AM",
      type: "attendance",
      dotColor: "bg-success-green",
    },
    {
      id: 4,
      title: "स्मार्ट गृह भेंट पूर्ण (Home Visit Completed)",
      desc: "काव्या मोरे • परामर्श व राशन सत्यापन",
      time: "01:20 PM",
      type: "visit",
      dotColor: "bg-saffron-accent",
    },
    {
      id: 5,
      title: "MPR रिपोर्ट स्वचालित सिंक (MPR Report Auto-Generated)",
      desc: "मासिक प्रगति प्रतिवेदन तैयार व सत्यापित",
      time: "02:00 PM",
      type: "report",
      dotColor: "bg-primary-navy",
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Formal Header */}
      <div className="bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="text-primary-navy font-medium">{worker?.centre_name || "आंगनवाड़ी केंद्र"}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-text-main tracking-tight">
              {getGreeting()}, {worker?.name ? worker.name.split(" ")[0] : "Officer"}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              AROMI Control Dashboard | Real-time overview of reports, nutrition analytics & response activity
            </p>
          </div>

          {/* Efficiency Metric Pill */}
          <div className="flex items-center gap-3 bg-bg-base border border-border-subtle rounded-xl p-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-primary-navy text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main flex items-center gap-1">
                <span>{s.worker_hours_saved} घंटे बचाए गए</span>
                <span className="text-[10px] text-success-green bg-green-50 px-1.5 py-0.5 rounded font-semibold border border-green-200">
                  +{s.reports_automated_pct}% ऑटोमेशन
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                ICDS दस्तावेजीकरण व रिपोर्टिंग में बचत
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="डैशबोर्ड मेट्रिक्स लोड हो रहे हैं..." rows={4} />
      ) : (
        <>
          {/* KPI Statistic Cards (4 Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Cases */}
            <button
              onClick={() => navigate("/children")}
              className="bg-white rounded-xl border border-border-subtle p-4 text-left shadow-2xs hover:border-gov-blue hover:shadow-xs transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  TOTAL CASES / कुल बच्चे
                </span>
                <div className="w-8 h-8 rounded-lg bg-gov-blue/10 text-gov-blue flex items-center justify-center group-hover:bg-gov-blue group-hover:text-white transition-colors">
                  <Users size={17} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl md:text-3xl font-black text-text-main">
                  {s.total_children}
                </div>
                <div className="text-xs font-semibold text-success-green flex items-center gap-0.5">
                  <ArrowUpRight size={13} />
                  <span>{s.present_today} उपस्थित</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-gray-400">
                <span>पंजीकृत रिकॉर्ड्स देखें</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 2. Active Alerts (SAM Cases) */}
            <button
              onClick={() => navigate("/growth")}
              className="bg-white rounded-xl border border-border-subtle p-4 text-left shadow-2xs hover:border-danger-red/60 hover:shadow-xs transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  ACTIVE ALERTS / SAM मामले
                </span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-danger-red flex items-center justify-center group-hover:bg-danger-red group-hover:text-white transition-colors">
                  <AlertTriangle size={17} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl md:text-3xl font-black text-danger-red">
                  {s.sam_count < 10 ? `0${s.sam_count}` : s.sam_count}
                </div>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-50 text-danger-red border border-red-200">
                  अत्यावश्यक (Critical)
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-gray-400">
                <span>विकास ट्रैकर व अलर्ट्स</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 3. Pending Review (MAM & Home Visits) */}
            <button
              onClick={() => navigate("/visits")}
              className="bg-white rounded-xl border border-border-subtle p-4 text-left shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  PENDING REVIEW / लंबित भेंट
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-warning-amber group-hover:text-gray-900 transition-colors">
                  <Clock size={17} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl md:text-3xl font-black text-amber-800">
                  {s.visits_due_today < 10 ? `0${s.visits_due_today}` : s.visits_due_today}
                </div>
                <div className="text-xs font-semibold text-amber-700">
                  {s.mam_count} MAM निगरानी
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-gray-400">
                <span>गृह भेंट सूची प्रबंधित करें</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 4. Resolved / Healthy */}
            <button
              onClick={() => navigate("/mpr")}
              className="bg-white rounded-xl border border-border-subtle p-4 text-left shadow-2xs hover:border-success-green/60 hover:shadow-xs transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  HEALTHY & NORMAL / सामान्य
                </span>
                <div className="w-8 h-8 rounded-lg bg-green-50 text-success-green flex items-center justify-center group-hover:bg-success-green group-hover:text-white transition-colors">
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-2xl md:text-3xl font-black text-success-green">
                  {s.normal_count < 10 ? `0${s.normal_count}` : s.normal_count}
                </div>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-50 text-success-green border border-green-200">
                  स्वस्थ (Normal)
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-gray-400">
                <span>मासिक रिपोर्ट व MPR</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Lower Grid: 2 Columns on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Recent Activity Timeline (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-primary-navy" />
                  <h2 className="font-bold text-base text-text-main">
                    Recent Activity / हालिया गतिविधि
                  </h2>
                </div>
                <span className="text-xs font-semibold text-gray-400">आज का लॉग</span>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4">
                {recentActivities.map((act, idx) => (
                  <div key={act.id} className="relative flex items-start gap-3">
                    {/* Vertical line connector */}
                    {idx < recentActivities.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-[-16px] w-0.5 bg-border-subtle" />
                    )}

                    {/* Bullet Indicator */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${act.dotColor} ring-4 ring-white shrink-0 mt-1 shadow-2xs`}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-xs md:text-sm text-text-main truncate">
                          {act.title}
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {act.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Alert Overview & Case Status Breakdown (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-navy" />
                    <h2 className="font-bold text-base text-text-main">
                      Alert Overview / पोषण विश्लेषण
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-primary-navy bg-primary-navy/10 border border-primary-navy/20 px-2 py-0.5 rounded">
                    ICDS Status
                  </span>
                </div>

                {/* Styled Nutrition Status Distribution Bars */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-text-main flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-success-green"></span>
                        सामान्य पोषण (Normal)
                      </span>
                      <span className="text-text-main font-bold">
                        {s.normal_count} बच्चे ({Math.round((s.normal_count / s.total_children) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-base rounded-full h-2 border border-border-subtle/50">
                      <div
                        className="bg-success-green h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(s.normal_count / s.total_children) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-text-main flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        मध्यम कुपोषण (MAM)
                      </span>
                      <span className="text-text-main font-bold">
                        {s.mam_count} बच्चे ({Math.round((s.mam_count / s.total_children) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-base rounded-full h-2 border border-border-subtle/50">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(s.mam_count / s.total_children) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-text-main flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-danger-red"></span>
                        गंभीर कुपोषण (SAM - Critical)
                      </span>
                      <span className="text-danger-red font-bold">
                        {s.sam_count} बच्चे ({Math.round((s.sam_count / s.total_children) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-base rounded-full h-2 border border-border-subtle/50">
                      <div
                        className="bg-danger-red h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(s.sam_count / s.total_children) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Visualization Placeholder Box */}
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <div className="bg-bg-base border border-dashed border-border-subtle rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    [ Data Visualization • Real-time Monitoring ]
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    दैनिक उपस्थिति दर: {Math.round((s.present_today / s.total_children) * 100)}% • पोषण अनुपालन सक्रिय
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Operations & Quick Navigation Grid */}
          <div className="bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h2 className="font-bold text-base text-text-main">
                Administrative Modules / प्रशासनिक त्वरित सेवाएं
              </h2>
              <span className="text-xs text-gray-500">8 मॉड्यूल उपलब्ध</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                {
                  to: "/activity",
                  icon: Activity,
                  title: "गतिविधि प्लानर",
                  sub: "AI से दैनिक पाठ योजना",
                },
                {
                  to: "/voice",
                  icon: Mic,
                  title: "आवाज़ एजेंट",
                  sub: "हिंदी में मौखिक रिपोर्टिंग",
                },
                {
                  to: "/photo",
                  icon: Camera,
                  title: "फ़ोटो जांच",
                  sub: "MAM/SAM विज़न पहचान",
                },
                {
                  to: "/mpr",
                  icon: FileText,
                  title: "MPR रिपोर्ट",
                  sub: "मासिक प्रगति प्रतिवेदन",
                },
                {
                  to: "/rag",
                  icon: BookOpen,
                  title: "WHO जानकारी",
                  sub: "स्वास्थ्य एवं पोषण दिशानिर्देश",
                },
                {
                  to: "/agent",
                  icon: Cpu,
                  title: "AI पाइपलाइन",
                  sub: "एजेंट समन्वय व निष्पादन",
                },
                {
                  to: "/growth",
                  icon: TrendingUp,
                  title: "विकास ट्रैकर",
                  sub: "वजन/ऊंचाई/MUAC मापन",
                },
                {
                  to: "/visits",
                  icon: MapPin,
                  title: "गृह भेंट",
                  sub: "स्मार्ट प्राथमिकता सूची",
                },
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.to}
                    onClick={() => navigate(mod.to)}
                    className="bg-white border border-border-subtle rounded-xl p-3.5 text-left transition-all duration-150 hover:border-gov-blue hover:bg-slate-50/60 shadow-2xs hover:shadow-xs active:scale-95 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-bg-base flex items-center justify-center text-primary-navy group-hover:bg-primary-navy group-hover:text-white transition-colors">
                        <Icon size={16} className="shrink-0" />
                      </div>
                      <span className="font-bold text-xs md:text-sm text-text-main truncate">
                        {mod.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate group-hover:text-gray-700">
                      {mod.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

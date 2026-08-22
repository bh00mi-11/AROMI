import { useState, useEffect } from "react";
import { Cpu, Play, CheckCircle, Clock, AlertCircle, RefreshCw, ArrowRight, Zap, BarChart2, Activity } from "lucide-react";
import { agentAPI, AgentStatus, DashboardSummary } from "../lib/api";

const AGENTS = [
  { key: "vision_screener",   emoji: "📷", labelHi: "विज़न स्क्रीनिंग एजेंट",   desc: "फ़ोटो से MAM/SAM पहचान",        color: "text-blue-700",   bgActive: "bg-blue-50 border-blue-300",   bgIdle: "bg-white border-border-subtle" },
  { key: "voice_assistant",   emoji: "🎙️", labelHi: "वॉइस असिस्टेंट एजेंट",    desc: "ग्रामीण बोलियों में STT/NLP",    color: "text-purple-700", bgActive: "bg-purple-50 border-purple-300", bgIdle: "bg-white border-border-subtle" },
  { key: "growth_monitor",    emoji: "📈", labelHi: "विकास निगरानी एजेंट",     desc: "Z-score व विसंगति जांच",         color: "text-emerald-700",  bgActive: "bg-emerald-50 border-emerald-300",  bgIdle: "bg-white border-border-subtle" },
  { key: "visit_scheduler",   emoji: "🏠", labelHi: "गृह भेंट शेड्यूलर",       desc: "जोखिम आधारित प्राथमिकता",        color: "text-amber-700", bgActive: "bg-amber-50 border-amber-300", bgIdle: "bg-white border-border-subtle" },
  { key: "mpr_compiler",      emoji: "📄", labelHi: "MPR संकलन एजेंट",          desc: "स्वतः मासिक प्रगति प्रतिवेदन",  color: "text-rose-700",    bgActive: "bg-rose-50 border-rose-300",    bgIdle: "bg-white border-border-subtle" },
  { key: "disha_compliance",  emoji: "🛡️", labelHi: "DISHA अनुपालन एजेंट",      desc: "ICDS मानक सत्यापन",              color: "text-teal-700",   bgActive: "bg-teal-50 border-teal-300",   bgIdle: "bg-white border-border-subtle" },
];

function StatusIcon({ status }: { status: AgentStatus["status"] }) {
  if (status === "running")   return <RefreshCw size={18} className="text-gov-blue animate-spin" />;
  if (status === "completed") return <CheckCircle size={18} className="text-success-green" />;
  if (status === "failed")    return <AlertCircle size={18} className="text-danger-red" />;
  return <Clock size={18} className="text-slate-400" />;
}

function ImpactBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-text-main">{label}</span>
        <span className="text-slate-700 font-bold">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-border-subtle">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SEED_HISTORY = [
  { day: "1 अग",  mam: 5, sam: 3, normal: 12 },
  { day: "5 अग",  mam: 4, sam: 3, normal: 13 },
  { day: "10 अग", mam: 4, sam: 2, normal: 14 },
  { day: "15 अग", mam: 3, sam: 2, normal: 15 },
  { day: "20 अग", mam: 3, sam: 1, normal: 16 },
  { day: "आज",    mam: 3, sam: 1, normal: 16 },
];

export default function AgentPipeline() {
  const [pipeline, setPipeline] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<DashboardSummary | null>(null);
  const [animating, setAnimating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [tab, setTab] = useState<"pipeline" | "impact">("pipeline");

  const loadData = async () => {
    try {
      const [pipeRes, metRes] = await Promise.all([agentAPI.getPipeline(), agentAPI.getMetrics()]);
      const pipeData = Array.isArray(pipeRes.data) ? pipeRes.data : (pipeRes.data?.pipeline || []);
      setPipeline(pipeData);
      setMetrics(metRes.data);
    } catch {
      // Offline / fallback defaults
      setPipeline((prev) => (prev.length > 0 ? prev : [
        { agent: "vision_screener", status: "completed", last_run: "2026-08-22 10:00", duration_ms: 120 },
        { agent: "voice_assistant", status: "completed", last_run: "2026-08-22 10:05", duration_ms: 340 },
        { agent: "growth_monitor", status: "running", last_run: "2026-08-22 10:10", duration_ms: 210 },
        { agent: "visit_scheduler", status: "idle", last_run: null, duration_ms: null },
        { agent: "mpr_compiler", status: "idle", last_run: null, duration_ms: null },
        { agent: "disha_compliance", status: "idle", last_run: null, duration_ms: null },
      ]));
      setMetrics((prev) => prev || {
        total_children: 20,
        present_today: 16,
        mam_count: 3,
        sam_count: 1,
        normal_count: 16,
        visits_due_today: 2,
        worker_hours_saved: 15.0,
        reports_automated_pct: 97.0,
      });
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const runAnimation = async () => {
    if (animating) return;
    setAnimating(true);
    setVisibleCount(0);
    for (let i = 0; i <= AGENTS.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setVisibleCount(i);
    }
    setAnimating(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
              <Cpu size={22} className="text-primary-navy" />
              <span>स्वायत्त AI एजेंट पाइपलाइन</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              AROMI के 6 स्वायत्त एजेंट समन्वय में कार्य करते हैं
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAnimation}
              disabled={animating}
              aria-label="Refresh Status"
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue ${
                animating
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-border-subtle"
                  : "btn-primary cursor-pointer"
              }`}
            >
              <Play size={13} />
              <span>{animating ? "सिम्युलेशन चल रहा है..." : "सिम्युलेशन चलाएं"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Agent Pipeline and Impact Tabs" className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
        {[
          { key: "pipeline", label: "एजेंट पाइपलाइन" },
          { key: "impact",   label: "प्रभाव मेट्रिक्स" },
        ].map(t => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
              tab === t.key ? "bg-white text-primary-navy shadow-2xs" : "text-slate-600 hover:text-text-main"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {AGENTS.map((meta, i) => {
              const status = pipeline.find(p => p.agent === meta.key) || { agent: meta.key, status: "idle" as const, last_run: null, duration_ms: null };
              const visible = !animating || visibleCount > i;
              const isRunning = status.status === "running";
              const isDone    = status.status === "completed";
              const bg = (isRunning || isDone) ? meta.bgActive : meta.bgIdle;
              return (
                <div key={meta.key} className="space-y-2">
                  <div
                    className={`transition-all duration-300 border rounded-xl p-4.5 ${bg} ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    } ${isRunning ? "shadow-md ring-2 ring-gov-blue" : "shadow-2xs"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-white rounded-lg border border-border-subtle shadow-2xs">{meta.emoji}</span>
                        <div>
                          <div className={`text-sm font-bold ${meta.color}`}>{meta.labelHi}</div>
                          <div className="text-xs text-slate-600 mt-0.5 font-medium">{meta.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={status.status} />
                      </div>
                    </div>
                    {isDone && status.duration_ms && (
                      <div className="mt-2.5 pt-2 border-t border-border-subtle/60 flex items-center gap-1.5 text-xs text-slate-600 font-mono font-medium">
                        <Zap size={12} className="text-amber-600" />
                        <span>निष्पादन समय: {status.duration_ms} ms</span>
                      </div>
                    )}
                    {isRunning && (
                      <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-gov-blue animate-pulse w-2/3 rounded-full" />
                      </div>
                    )}
                  </div>
                  {i < AGENTS.length - 1 && (
                    <div className={`flex justify-center my-1 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
                      <ArrowRight size={16} className={`rotate-90 ${animating && visibleCount === i ? "text-gov-blue animate-bounce" : "text-slate-400"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium justify-center pt-3 border-t border-border-subtle">
            {[
              { icon: <Clock size={14} className="text-slate-400" />, label: "निष्क्रिय (Idle)" },
              { icon: <RefreshCw size={14} className="text-gov-blue animate-spin" />, label: "सक्रिय (Running)" },
              { icon: <CheckCircle size={14} className="text-success-green" />, label: "सफल (Completed)" },
              { icon: <AlertCircle size={14} className="text-danger-red" />, label: "त्रुटि (Failed)" }
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                {l.icon}
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "impact" && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "घंटे बचाए (मासिक)", value: metrics.worker_hours_saved, unit: "h", sub: "प्रति कार्यकर्ता", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
              { label: "रिपोर्ट स्वचालित",  value: metrics.reports_automated_pct, unit: "%", sub: "MPR / रिकॉर्ड", color: "text-emerald-800", bg: "bg-emerald-50 border-emerald-200" },
              { label: "कुल बच्चे",          value: metrics.total_children, unit: "", sub: "सक्रिय पंजीकृत", color: "text-gov-blue", bg: "bg-white border-border-subtle" },
              { label: "आज उपस्थित",         value: metrics.present_today, unit: "", sub: `${Math.round((metrics.present_today/metrics.total_children)*100)}% उपस्थिति दर`, color: "text-primary-navy", bg: "bg-white border-border-subtle" },
            ].map(m => (
              <div key={m.label} className={`${m.bg} rounded-xl p-5 border shadow-2xs text-center space-y-1`}>
                <div className={`text-3xl font-black ${m.color}`}>{m.value}{m.unit}</div>
                <div className="text-xs text-text-main font-bold mt-1">{m.label}</div>
                <div className="text-xs text-slate-600 font-medium">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <BarChart2 size={16} className="text-primary-navy" />
              <h2 className="text-sm font-bold text-text-main">समग्र पोषण स्थिति वितरण</h2>
            </div>
            <ImpactBar label="सामान्य (Normal)"    value={metrics.normal_count} max={metrics.total_children} color="bg-emerald-600" />
            <ImpactBar label="MAM (मध्यम कुपोषण)" value={metrics.mam_count}    max={metrics.total_children} color="bg-amber-500" />
            <ImpactBar label="SAM (गंभीर कुपोषण)" value={metrics.sam_count}    max={metrics.total_children} color="bg-rose-600" />
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-primary-navy" />
                <h2 className="text-sm font-bold text-text-main">30 दिवसीय पोषण रुझान विश्लेषण</h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                SAM ↓ 33% कमी 📉
              </span>
            </div>
            <div className="flex items-end gap-2 h-24 pt-2">
              {SEED_HISTORY.map((row, i) => {
                const total = row.mam + row.sam + row.normal;
                const samH  = Math.round((row.sam / total) * 80);
                const mamH  = Math.round((row.mam / total) * 80);
                const normH = 80 - samH - mamH;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col rounded-t overflow-hidden border border-border-subtle" style={{ height: 80 }}>
                      <div className="bg-emerald-400 w-full" style={{ height: normH }} title={`Normal: ${row.normal}`} />
                      <div className="bg-amber-300 w-full" style={{ height: mamH }} title={`MAM: ${row.mam}`} />
                      <div className="bg-rose-400 w-full"   style={{ height: samH }} title={`SAM: ${row.sam}`} />
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1.5 text-center font-bold">{row.day}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 pt-2 border-t border-border-subtle justify-center text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> सामान्य पोषण</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block" /> MAM मध्यम</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> SAM गंभीर</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

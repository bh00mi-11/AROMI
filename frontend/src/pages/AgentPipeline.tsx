import { useEffect, useState, useRef } from "react";
import { agentAPI, dashboardAPI } from "../lib/api";
import {
  CheckCircle, Clock, AlertCircle, Cpu, Activity,
  ArrowRight, RefreshCw, Zap, BarChart2
} from "lucide-react";

interface AgentStatus {
  agent: string;
  status: "idle" | "running" | "completed" | "failed";
  last_run: string | null;
  duration_ms: number | null;
}

interface ImpactMetrics {
  total_children: number;
  mam_count: number;
  sam_count: number;
  normal_count: number;
  worker_hours_saved: number;
  reports_automated_pct: number;
  present_today: number;
  visits_due_today: number;
}

const AGENTS = [
  { key: "health_agent",       labelHi: "स्वास्थ्य एजेंट",   desc: "पोषण स्तर का आकलन",  emoji: "🏥", color: "text-blue-600",   bgIdle: "bg-blue-50 border-blue-200",   bgActive: "bg-blue-100 border-blue-400"   },
  { key: "risk_agent",         labelHi: "जोखिम एजेंट",      desc: "जोखिम स्कोर गणना",   emoji: "⚠️", color: "text-yellow-600", bgIdle: "bg-yellow-50 border-yellow-200", bgActive: "bg-yellow-100 border-yellow-400"},
  { key: "intervention_agent", labelHi: "हस्तक्षेप एजेंट",  desc: "पोषण योजना तैयार",   emoji: "💊", color: "text-red-600",    bgIdle: "bg-red-50 border-red-200",     bgActive: "bg-red-100 border-red-400"     },
  { key: "visit_agent",        labelHi: "भ्रमण एजेंट",      desc: "फॉलो-अप शेड्यूल",    emoji: "🏠", color: "text-green-600",  bgIdle: "bg-green-50 border-green-200",  bgActive: "bg-green-100 border-green-400" },
  { key: "reporting_agent",    labelHi: "रिपोर्टिंग एजेंट", desc: "रिकॉर्ड सहेजना",     emoji: "📋", color: "text-purple-600", bgIdle: "bg-purple-50 border-purple-200",bgActive: "bg-purple-100 border-purple-400"},
];

const DEMO_PIPELINE: AgentStatus[] = [
  { agent: "health_agent",       status: "completed", last_run: new Date().toISOString(), duration_ms: 312  },
  { agent: "risk_agent",         status: "completed", last_run: new Date().toISOString(), duration_ms: 198  },
  { agent: "intervention_agent", status: "completed", last_run: new Date().toISOString(), duration_ms: 1420 },
  { agent: "visit_agent",        status: "completed", last_run: new Date().toISOString(), duration_ms: 89   },
  { agent: "reporting_agent",    status: "completed", last_run: new Date().toISOString(), duration_ms: 56   },
];

const DEMO_METRICS: ImpactMetrics = {
  total_children: 24, mam_count: 7, sam_count: 2, normal_count: 15,
  worker_hours_saved: 18.0, reports_automated_pct: 97,
  present_today: 19, visits_due_today: 3,
};

const SEED_HISTORY = [
  { day: "1 जून",  mam: 9, sam: 3, normal: 12 },
  { day: "5 जून",  mam: 8, sam: 3, normal: 13 },
  { day: "10 जून", mam: 8, sam: 2, normal: 14 },
  { day: "15 जून", mam: 7, sam: 2, normal: 15 },
  { day: "20 जून", mam: 7, sam: 2, normal: 15 },
  { day: "आज",     mam: 7, sam: 2, normal: 15 },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle size={18} className="text-green-500" />;
  if (status === "running")   return <RefreshCw   size={18} className="text-blue-500 animate-spin" />;
  if (status === "failed")    return <AlertCircle size={18} className="text-red-500" />;
  return <Clock size={18} className="text-gray-400" />;
}

function ImpactBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AgentPipeline() {
  const [pipeline, setPipeline] = useState<AgentStatus[]>(DEMO_PIPELINE.map(a => ({ ...a, status: "idle" as const })));
  const [metrics, setMetrics]   = useState<ImpactMetrics | null>(null);
  const [animating, setAnimating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [tab, setTab] = useState<"pipeline" | "impact">("pipeline");
  const [hasRun, setHasRun] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    agentAPI.pipelineStatus()
      .then(r => { setPipeline(r.data.pipeline || DEMO_PIPELINE); setVisibleCount(5); setHasRun(true); })
      .catch(() => { setTimeout(() => { setPipeline(DEMO_PIPELINE); setVisibleCount(5); setHasRun(true); }, 600); });
    dashboardAPI.stats()
      .then(r => setMetrics(r.data))
      .catch(() => setMetrics(DEMO_METRICS));
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const runAnimation = () => {
    if (animating) return;
    setAnimating(true); setHasRun(false); setVisibleCount(0);
    setPipeline(DEMO_PIPELINE.map(a => ({ ...a, status: "idle" as const })));
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    DEMO_PIPELINE.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setPipeline(prev => prev.map((a, idx) => idx === i ? { ...a, status: "running" } : a));
        setVisibleCount(i + 1);
      }, i * 900);
      const t2 = setTimeout(() => {
        setPipeline(prev => prev.map((a, idx) => idx === i ? { ...a, status: "completed" } : a));
        if (i === DEMO_PIPELINE.length - 1) { setAnimating(false); setHasRun(true); }
      }, i * 900 + (DEMO_PIPELINE[i].duration_ms! / 2));
      timersRef.current.push(t1, t2);
    });
  };

  const totalMs = DEMO_PIPELINE.reduce((s, a) => s + (a.duration_ms || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Cpu size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-gray-800">AI एजेंट पाइपलाइन</h1>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">5-एजेंट ऑर्केस्ट्रेशन · स्वचालित कुपोषण प्रबंधन</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[{ key: "pipeline", label: "🔗 पाइपलाइन" }, { key: "impact", label: "📊 प्रभाव" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.key ? "bg-white text-primary shadow-sm" : "text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
        <>
          <button onClick={runAnimation} disabled={animating}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${animating ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary text-white active:scale-95"}`}>
            {animating ? <><RefreshCw size={16} className="animate-spin" /> पाइपलाइन चल रही है…</> : <><Activity size={16} /> पाइपलाइन चलाएं (डेमो)</>}
          </button>

          {hasRun && (
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "एजेंट", value: "5 / 5", sub: "पूर्ण" }, { label: "कुल समय", value: `${totalMs} ms`, sub: "< 2 सेकंड" }, { label: "स्थिति", value: "✅", sub: "सफल" }]
                .map(s => (
                  <div key={s.label} className="card text-center py-2">
                    <div className="text-base font-bold text-primary">{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                    <div className="text-[9px] text-gray-400">{s.sub}</div>
                  </div>
                ))}
            </div>
          )}

          <div className="space-y-0">
            {AGENTS.map((meta, i) => {
              const status = pipeline.find(p => p.agent === meta.key) || { agent: meta.key, status: "idle" as const, last_run: null, duration_ms: null };
              const visible = !animating || visibleCount > i;
              const isRunning = status.status === "running";
              const isDone    = status.status === "completed";
              const bg = (isRunning || isDone) ? meta.bgActive : meta.bgIdle;
              return (
                <div key={meta.key}>
                  <div className={`transition-all duration-500 border-2 rounded-xl p-3 ${bg} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${isRunning ? "shadow-lg scale-[1.02]" : ""}`}
                    style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.emoji}</span>
                        <div>
                          <div className={`text-xs font-bold ${meta.color}`}>{meta.labelHi}</div>
                          <div className="text-[10px] text-gray-500">{meta.desc}</div>
                        </div>
                      </div>
                      <StatusIcon status={status.status} />
                    </div>
                    {isDone && status.duration_ms && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400"><Zap size={10} /><span>{status.duration_ms} ms</span></div>
                    )}
                    {isRunning && (
                      <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-blue-400 animate-pulse w-2/3 rounded-full" />
                      </div>
                    )}
                  </div>
                  {i < AGENTS.length - 1 && (
                    <div className={`flex justify-center my-0.5 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
                      <ArrowRight size={16} className={`rotate-90 ${animating && visibleCount === i ? "text-blue-400 animate-bounce" : "text-gray-300"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 text-[10px] text-gray-500 justify-center pt-1">
            {[{ icon: <Clock size={11} />, label: "निष्क्रिय" }, { icon: <RefreshCw size={11} className="text-blue-400" />, label: "चल रहा" },
              { icon: <CheckCircle size={11} className="text-green-500" />, label: "पूर्ण" }, { icon: <AlertCircle size={11} className="text-red-500" />, label: "विफल" }]
              .map(l => <div key={l.label} className="flex items-center gap-1">{l.icon}<span>{l.label}</span></div>)}
          </div>
        </>
      )}

      {tab === "impact" && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "घंटे बचाए (मासिक)", value: metrics.worker_hours_saved, unit: "h", sub: "प्रति कार्यकर्ता", color: "text-orange-500", bg: "bg-orange-50" },
              { label: "रिपोर्ट स्वचालित",  value: metrics.reports_automated_pct, unit: "%", sub: "MPR / रिकॉर्ड", color: "text-green-600", bg: "bg-green-50" },
              { label: "कुल बच्चे",          value: metrics.total_children, unit: "", sub: "सक्रिय पंजीकृत", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "आज उपस्थित",         value: metrics.present_today, unit: "", sub: `${Math.round((metrics.present_today/metrics.total_children)*100)}% उपस्थिति दर`, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(m => (
              <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}{m.unit}</div>
                <div className="text-[10px] text-gray-600 font-medium mt-0.5">{m.label}</div>
                <div className="text-[9px] text-gray-400">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1"><BarChart2 size={14} className="text-primary" /><span className="text-xs font-bold text-gray-700">पोषण स्थिति</span></div>
            <ImpactBar label="सामान्य (Normal)"    value={metrics.normal_count} max={metrics.total_children} color="bg-green-400" />
            <ImpactBar label="MAM (मध्यम कुपोषण)" value={metrics.mam_count}    max={metrics.total_children} color="bg-yellow-400" />
            <ImpactBar label="SAM (गंभीर कुपोषण)" value={metrics.sam_count}    max={metrics.total_children} color="bg-red-500" />
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-primary" />
              <span className="text-xs font-bold text-gray-700">30 दिन का रुझान</span>
              <span className="text-[9px] text-gray-400 ml-auto">SAM ↓ 33% 📉</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {SEED_HISTORY.map((row, i) => {
                const total = row.mam + row.sam + row.normal;
                const samH  = Math.round((row.sam / total) * 64);
                const mamH  = Math.round((row.mam / total) * 64);
                const normH = 64 - samH - mamH;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ height: 64 }}>
                      <div className="bg-green-300 w-full" style={{ height: normH }} />
                      <div className="bg-yellow-300 w-full" style={{ height: mamH }} />
                      <div className="bg-red-400 w-full"   style={{ height: samH }} />
                    </div>
                    <div className="text-[8px] text-gray-400 mt-1 text-center leading-tight">{row.day}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-2 justify-center text-[9px]">
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-green-300 inline-block" /> सामान्य</span>
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-yellow-300 inline-block" /> MAM</span>
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> SAM</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🏠</div>
            <div>
              <div className="text-sm font-bold text-gray-800">{metrics.visits_due_today} आज के गृह भ्रमण</div>
              <div className="text-[10px] text-gray-500">SAM + MAM बच्चों के लिए शेड्यूल</div>
            </div>
            <span className="ml-auto bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">बकाया</span>
          </div>
        </div>
      )}
    </div>
  );
}

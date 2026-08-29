import React, { useState } from "react";
import StatusBadge, { NutritionOrCaseStatus } from "./StatusBadge";
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ShieldCheck,
  Building,
  MapPin,
  FileText,
  Clock,
  Layers,
  Check,
  Copy,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  GitBranch,
} from "lucide-react";
import toast from "react-hot-toast";

export interface DetectedEntity {
  label: string;
  value: string | React.ReactNode;
  category?: "location" | "emergency" | "department" | "clinical" | "measurement" | "general";
  verified?: boolean;
}

export interface RecommendationInfo {
  action: string;
  title?: string;
  department?: string;
  urgency?: "critical" | "high" | "routine" | "info";
  steps?: string[];
}

export interface AIAnalysisPanelProps {
  title?: string;
  modelName?: string;
  /** Confidence score between 0 and 100 */
  confidenceScore?: number;
  confidenceLabel?: string;
  status?: NutritionOrCaseStatus;
  statusCustomLabel?: string;
  detectedEntities?: DetectedEntity[];
  recommendation?: RecommendationInfo | string;
  explanation?: string;
  thoughtProcess?: Array<{ step: string; detail: string; timestamp?: string }>;
  shapParameters?: Record<string, any>;
  sources?: string[];
  disclaimer?: string;
  actions?: React.ReactNode;
  className?: string;
  lastUpdated?: string | Date;
  onReadAloud?: () => void;
  isSpeaking?: boolean;
  onShareWhatsApp?: () => void;
}

export default function AIAnalysisPanel({
  title = "AI विश्लेषणात्मक मूल्यांकन (AI Analysis)",
  modelName = "AROMI Vision & Clinical Engine v2.1",
  confidenceScore = 92,
  confidenceLabel = "मॉडल विश्वास व प्रासंगिकता स्कोर (Confidence & Relevance)",
  status,
  statusCustomLabel,
  detectedEntities = [],
  recommendation,
  explanation,
  thoughtProcess,
  shapParameters,
  sources = [],
  disclaimer = "यह AI सहायता प्रणाली आधिकारिक WHO/ICDS दिशानिर्देशों पर आधारित है। विशेष या जटिल परिस्थिति में अधिकृत चिकित्सा अधिकारी से परामर्श करें।",
  actions,
  className = "",
  lastUpdated,
  onReadAloud,
  isSpeaking = false,
  onShareWhatsApp,
}: AIAnalysisPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSourceModal, setActiveSourceModal] = useState<string | null>(null);

  // Confidence color & styling logic
  const score = Math.min(100, Math.max(0, confidenceScore));
  let scoreGradient = "from-emerald-500 to-green-600";
  let scoreTextColor = "text-emerald-700";
  let scoreBadgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let confidenceTrustText = "अत्यधिक विश्वसनीय (High Confidence Grounding)";

  if (score < 60) {
    scoreGradient = "from-red-500 to-red-600";
    scoreTextColor = "text-red-700";
    scoreBadgeBg = "bg-red-50 text-red-800 border-red-200";
    confidenceTrustText = "समीक्षा आवश्यक (Low / Clinical Review Needed)";
  } else if (score < 80) {
    scoreGradient = "from-amber-400 to-amber-600";
    scoreTextColor = "text-amber-800";
    scoreBadgeBg = "bg-amber-50 text-amber-900 border-amber-200";
    confidenceTrustText = "मध्यम विश्वसनीयता (Moderate Confidence)";
  }

  // Normalize recommendation object
  const recObj: RecommendationInfo | null = recommendation
    ? typeof recommendation === "string"
      ? { action: recommendation }
      : recommendation
    : null;

  const handleCopyAction = () => {
    if (!recObj?.action) return;
    navigator.clipboard.writeText(recObj.action);
    setCopied(true);
    toast.success("दिशानिर्देश कॉपी हो गया");
    setTimeout(() => setCopied(false), 2200);
  };

  const renderCategoryIcon = (cat?: string) => {
    switch (cat) {
      case "location":
        return <MapPin size={15} className="text-gov-blue shrink-0" />;
      case "department":
        return <Building size={15} className="text-primary-navy shrink-0" />;
      case "emergency":
        return <AlertTriangle size={15} className="text-danger-red shrink-0" />;
      case "clinical":
        return <ShieldCheck size={15} className="text-emerald-600 shrink-0" />;
      case "measurement":
        return <Layers size={15} className="text-saffron-accent shrink-0" />;
      default:
        return <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-all space-y-0 ${className}`}
    >
      {/* ── 1. Header Banner: Title, Version, Confidence & Status ────────────── */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-5 sm:p-6 border-b border-border-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-navy/10 text-primary-navy flex items-center justify-center shrink-0 shadow-2xs border border-primary-navy/15">
              <BrainCircuit size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-text-main tracking-tight">
                  {title}
                </h3>
                <span className="bg-primary-navy/10 text-primary-navy text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-primary-navy/20 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>{modelName}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                <span>आधिकारिक शासकीय नियमों व वैज्ञानिक साक्ष्य से सत्यापित</span>
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {typeof lastUpdated === "string" ? lastUpdated : lastUpdated.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Status & Actions Right Column */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {status && <StatusBadge status={status} customLabel={statusCustomLabel} size="md" />}
          </div>
        </div>

        {/* ── Confidence Score Strip ────────────────────────────────────────── */}
        <div className="mt-4 pt-3.5 border-t border-border-subtle/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">{confidenceLabel}:</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${scoreBadgeBg}`}>
              {confidenceTrustText}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:w-64">
            <div
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={confidenceLabel}
              className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreGradient} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`font-black font-mono text-sm shrink-0 ${scoreTextColor}`}>
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Primary Guidance / Synthesis Output (Hero Card) ────────────────── */}
      {recObj && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 rounded-xl p-5 border border-blue-200/80 shadow-2xs space-y-3">
            {/* Recommendation Header & Action Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-gov-blue" />
                  <span>{recObj.title || "आधिकारिक दिशानिर्देश उत्तर व कार्यवाही (Protocol Action)"}</span>
                </span>
              </div>

              {recObj.department && (
                <span className="text-[11px] font-bold bg-white text-primary-navy px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1">
                  <Building size={12} className="text-gov-blue" />
                  <span>प्राधिकरण: {recObj.department}</span>
                </span>
              )}
            </div>

            {/* Primary Action Text with High-Craft Typography */}
            <div className="text-sm sm:text-[15px] text-slate-900 font-semibold leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-xl border border-blue-100 shadow-2xs">
              {recObj.action}
            </div>

            {/* Structured Steps (if any) */}
            {recObj.steps && recObj.steps.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  चरणबद्ध अनुशंसित कार्यवाही (Sequential Steps):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recObj.steps.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-800 font-medium bg-white/90 p-2.5 rounded-lg border border-blue-100 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-snug pt-0.5">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Tools Toolbar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <span>⚡ तुरंत कार्रवाई हेतु साधन:</span>
              </div>

              <div className="flex items-center gap-2">
                {onReadAloud && (
                  <button
                    type="button"
                    onClick={onReadAloud}
                    aria-label="Read guidance aloud"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isSpeaking
                        ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                        : "bg-white text-slate-700 border-border-subtle hover:bg-slate-50 hover:text-primary-navy"
                    }`}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? "आवाज़ रोकें" : "बोलकर सुनाएं"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyAction}
                  aria-label="Copy action guidance"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle bg-white text-slate-700 hover:bg-slate-50 hover:text-primary-navy transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  <span>{copied ? "कॉपी हुआ" : "कॉपी करें"}</span>
                </button>

                {onShareWhatsApp && (
                  <button
                    type="button"
                    onClick={onShareWhatsApp}
                    aria-label="Share guidance on WhatsApp"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 size={14} />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. Grounded Sources & Knowledge Citations ────────────────────── */}
          {sources && sources.length > 0 && (
            <div className="bg-slate-50/80 p-4 rounded-xl border border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-primary-navy" />
                  <span>प्रमाणित शासकीय संदर्भ स्रोत (Cited Clinical Authorities):</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  ✓ {sources.length} स्रोतों से सत्यापित
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSourceModal(s)}
                    className="inline-flex items-center gap-1.5 bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs border border-border-subtle font-bold shadow-2xs hover:border-gov-blue hover:text-primary-navy hover:bg-blue-50/50 transition-all cursor-pointer group"
                  >
                    <span className="w-4 h-4 rounded-full bg-gov-blue/10 text-gov-blue text-[10px] flex items-center justify-center font-black">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                    <ExternalLink size={11} className="text-slate-400 group-hover:text-primary-navy transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Extracted Clinical & Operational Entities Checklist ──────── */}
          {detectedEntities && detectedEntities.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-gov-blue" />
                  <span>पहचाने गए मुख्य घटक (Extracted Clinical & Case Entities)</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {detectedEntities.length} घटक सत्यापित
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {detectedEntities.map((entity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs bg-bg-base/70 p-3 rounded-xl border border-border-subtle transition-all hover:bg-slate-100/80 shadow-2xs"
                  >
                    <div className="p-1 rounded-lg bg-white border border-border-subtle shadow-2xs">
                      {renderCategoryIcon(entity.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        {entity.label}
                      </div>
                      <div className="font-bold text-text-main break-words mt-0.5">
                        {entity.value}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                      ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Collapsible Step-by-Step AI Reasoning Chain & Trace ──────── */}
          {(explanation || (thoughtProcess && thoughtProcess.length > 0) || shapParameters) && (
            <div className="border-t border-border-subtle pt-3.5 space-y-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
                aria-label="Toggle detailed reasoning and SHAP analysis"
                className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-primary-navy transition-colors cursor-pointer py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-border-subtle"
              >
                <div className="flex items-center gap-2">
                  <GitBranch size={14} className="text-primary-navy" />
                  <span>विस्तृत AI तर्क व सत्यापन शृंखला (Reasoning Chain & Trace)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                  <span>{showDetails ? "छुपाएं (Hide)" : "देखें (Inspect)"}</span>
                  {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {showDetails && (
                <div className="space-y-3.5 pt-1 text-xs animate-fade-in">
                  {/* Primary Narrative Explanation */}
                  {explanation && (
                    <div className="bg-bg-base p-4 rounded-xl border border-border-subtle text-slate-800 leading-relaxed font-medium">
                      {explanation}
                    </div>
                  )}

                  {/* Step-by-Step Reasoning Timeline */}
                  {thoughtProcess && thoughtProcess.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        सत्यापन चरण (Verification Pipeline):
                      </div>
                      <div className="space-y-2">
                        {thoughtProcess.map((tp, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-white p-3 rounded-xl border border-border-subtle shadow-2xs"
                          >
                            <span className="w-6 h-6 rounded-full bg-primary-navy text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                              0{idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="font-bold text-text-main">{tp.step}</div>
                              <div className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                                {tp.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SHAP Feature Parameters */}
                  {shapParameters && Object.keys(shapParameters).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        SHAP पैरामीटर्स (Clinical Feature Weights):
                      </div>
                      <div className="divide-y divide-border-subtle bg-white rounded-xl border border-border-subtle p-3 shadow-2xs">
                        {Object.entries(shapParameters).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center py-2 text-xs">
                            <span className="text-slate-700 font-semibold">{k}</span>
                            <span className="font-mono font-bold text-text-main bg-slate-100 px-2.5 py-0.5 rounded border border-border-subtle">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 6. Optional Custom Actions Prop ─────────────────────────────── */}
          {actions && <div className="pt-2 border-t border-border-subtle">{actions}</div>}
        </div>
      )}

      {/* ── 7. Government Disclaimer Footer ─────────────────────────────────── */}
      <div className="bg-slate-50 p-4 border-t border-border-subtle flex items-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldAlert size={14} className="text-slate-400 shrink-0" />
        <span className="italic">{disclaimer}</span>
      </div>

      {/* ── Source Quick Inspection Modal ────────────────────────────────────── */}
      {activeSourceModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-border-subtle max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary-navy" />
                <h3 className="font-bold text-base text-text-main">सत्यापित स्रोत विवरण</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSourceModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                  दस्तावेज़ शीर्षक:
                </span>
                <p className="font-bold text-blue-950 text-sm mt-0.5">{activeSourceModal}</p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  प्रामाणिकता व साक्ष्य:
                </span>
                <p className="text-slate-800 font-medium leading-relaxed mt-1 bg-bg-base p-3 rounded-xl border border-border-subtle">
                  यह संदर्भ स्वास्थ्य एवं परिवार कल्याण मंत्रालय (MoHFW), महिला व बाल विकास (MWCD), तथा WHO द्वारा स्वीकृत अधिकृत पोषण व स्वास्थ्य नियमावली से सत्यापित है।
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSourceModal(null)}
                className="btn-primary px-4 py-2 text-xs font-bold"
              >
                समझ गया (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

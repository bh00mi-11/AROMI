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
} from "lucide-react";

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
}

export default function AIAnalysisPanel({
  title = "AI विश्लेषणात्मक मूल्यांकन (AI Analysis)",
  modelName = "AROMI Vision & Clinical Engine v2.1",
  // TODO: Backend integration - dynamic confidence score key fallback
  confidenceScore = 87,
  confidenceLabel = "मॉडल विश्वास स्कोर (Confidence Score)",
  status,
  detectedEntities = [],
  recommendation,
  explanation,
  thoughtProcess,
  shapParameters,
  sources = [],
  disclaimer = "यह AI सहायता प्रणाली है। अंतिम निर्णय अधिकृत चिकित्सा अधिकारी अथवा पर्यवेक्षक का होगा।",
  actions,
  className = "",
  lastUpdated,
}: AIAnalysisPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Confidence color styling
  const score = Math.min(100, Math.max(0, confidenceScore));
  let scoreColor = "bg-green-600";
  let scoreTextColor = "text-green-700";
  let scoreBadgeBg = "bg-green-50 text-green-700 border-green-200";
  let confidenceTrustText = "उच्च विश्वसनीयता (High Confidence)";

  if (score < 60) {
    scoreColor = "bg-red-600";
    scoreTextColor = "text-red-700";
    scoreBadgeBg = "bg-red-50 text-red-700 border-red-200";
    confidenceTrustText = "समीक्षा आवश्यक (Low / Review Needed)";
  } else if (score < 80) {
    scoreColor = "bg-amber-500";
    scoreTextColor = "text-amber-700";
    scoreBadgeBg = "bg-amber-50 text-amber-700 border-amber-200";
    confidenceTrustText = "मध्यम विश्वसनीयता (Moderate Confidence)";
  }

  // Normalize recommendation object
  const recObj: RecommendationInfo | null = recommendation
    ? typeof recommendation === "string"
      ? { action: recommendation }
      : recommendation
    : null;

  const renderCategoryIcon = (cat?: string) => {
    switch (cat) {
      case "location":
        return <MapPin size={13} className="text-gov-blue shrink-0 mt-0.5" />;
      case "department":
        return <Building size={13} className="text-primary-navy shrink-0 mt-0.5" />;
      case "emergency":
        return <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />;
      case "clinical":
        return <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />;
      case "measurement":
        return <Layers size={13} className="text-orange-500 shrink-0 mt-0.5" />;
      default:
        return <CheckCircle2 size={13} className="text-green-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs space-y-4 select-none transition-opacity duration-200 ease-out ${className}`}
    >
      {/* ── Header: Title, Model Badge, Status Badge ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-orange-50 border border-orange-200/80 text-primary">
            <BrainCircuit size={17} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>{title}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                {modelName}
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {typeof lastUpdated === "string"
                    ? lastUpdated
                    : lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {status && (
          <div className="self-start sm:self-center">
            <StatusBadge status={status} size="sm" />
          </div>
        )}
      </div>

      {/* ── Confidence Score Gauge ─────────────────────────────────────── */}
      <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-200/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-700">
            <Sparkles size={13} className="text-primary" />
            <span>{confidenceLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${scoreBadgeBg}`}
            >
              {confidenceTrustText}
            </span>
            <span className={`text-sm font-black font-mono ${scoreTextColor}`}>{score}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200/90 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${scoreColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* ── Detected Entities / Indicators Checklist (✓) ───────────────── */}
      {detectedEntities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              <span>पहचाने गए घटक (Detected Entities & Indicators)</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
              {detectedEntities.length} घटक सत्यापित
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detectedEntities.map((entity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 transition-colors hover:bg-slate-100/70"
              >
                {renderCategoryIcon(entity.category)}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">
                    {entity.label}
                  </div>
                  <div className="font-semibold text-gray-800 break-words mt-0.5">
                    {entity.value}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded shrink-0">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendation Block ───────────────────────────────────────── */}
      {recObj && (
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>📋 {recObj.title || "अनुशंसित अग्रिम कार्यवाही (Recommended Action)"}</span>
            </div>
            {recObj.department && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                विभाग: {recObj.department}
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-blue-950 font-medium leading-relaxed">
            {recObj.action}
          </p>

          {recObj.steps && recObj.steps.length > 0 && (
            <div className="space-y-1 pt-1">
              {recObj.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-900">
                  <span className="font-bold text-blue-700 shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Collapsible / Structured Detailed Reasoning & SHAP ─────────── */}
      {(explanation || (thoughtProcess && thoughtProcess.length > 0) || shapParameters || sources.length > 0) && (
        <div className="border-t border-gray-100 pt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-bold text-gray-700 hover:text-primary transition-colors cursor-pointer py-1"
          >
            <div className="flex items-center gap-1.5">
              <Info size={13} className="text-primary" />
              <span>विस्तृत AI तर्क व व्याख्या (Explainability & Reasoning Chain)</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-[11px]">
              <span>{showDetails ? "छुपाएं" : "देखें"}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {showDetails && (
            <div className="space-y-3 pt-1 animate-fade-in text-xs">
              {/* Primary Narrative Explanation */}
              {explanation && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/70 text-gray-700 leading-relaxed font-medium">
                  {explanation}
                </div>
              )}

              {/* Step-by-Step Thought Process */}
              {thoughtProcess && thoughtProcess.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">
                    प्रक्रिया चरण (Reasoning Steps):
                  </div>
                  <div className="space-y-1">
                    {thoughtProcess.map((tp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200/60"
                      >
                        <span className="font-mono font-bold text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border">
                          0{idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{tp.step}</div>
                          <div className="text-[11px] text-gray-600 mt-0.5">{tp.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHAP Feature Parameters */}
              {shapParameters && Object.keys(shapParameters).length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">
                    SHAP पैरामीटर्स (Feature Contributions):
                  </div>
                  <div className="divide-y divide-gray-100 bg-gray-50/60 rounded-lg border border-gray-200/60 p-2">
                    {Object.entries(shapParameters).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1.5 text-[11px]">
                        <span className="text-gray-600 font-medium">{k}</span>
                        <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAG Citations */}
              {sources && sources.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">
                    प्रमाणित संदर्भ स्रोत (Knowledge Citations):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] border border-gray-200/80 font-medium"
                      >
                        <FileText size={11} className="text-gray-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Custom Actions Toolbar ─────────────────────────────────────── */}
      {actions && <div className="pt-2 border-t border-gray-100">{actions}</div>}

      {/* ── Government Disclaimer Footer ───────────────────────────────── */}
      <div className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100 flex items-center gap-1.5">
        <ShieldCheck size={12} className="text-gray-400 shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}

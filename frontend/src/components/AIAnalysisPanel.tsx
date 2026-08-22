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
  let scoreTextColor = "text-green-800";
  let scoreBadgeBg = "bg-green-50 text-green-800 border-green-200";
  let confidenceTrustText = "उच्च विश्वसनीयता (High Confidence)";

  if (score < 60) {
    scoreColor = "bg-red-600";
    scoreTextColor = "text-red-800";
    scoreBadgeBg = "bg-red-50 text-red-800 border-red-200";
    confidenceTrustText = "समीक्षा आवश्यक (Low / Review Needed)";
  } else if (score < 80) {
    scoreColor = "bg-amber-500";
    scoreTextColor = "text-amber-900";
    scoreBadgeBg = "bg-amber-50 text-amber-900 border-amber-200";
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
        return <MapPin size={14} className="text-gov-blue shrink-0 mt-0.5" />;
      case "department":
        return <Building size={14} className="text-primary-navy shrink-0 mt-0.5" />;
      case "emergency":
        return <AlertTriangle size={14} className="text-danger-red shrink-0 mt-0.5" />;
      case "clinical":
        return <ShieldCheck size={14} className="text-success-green shrink-0 mt-0.5" />;
      case "measurement":
        return <Layers size={14} className="text-saffron-accent shrink-0 mt-0.5" />;
      default:
        return <CheckCircle2 size={14} className="text-success-green shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs space-y-5 select-none ${className}`}
    >
      {/* ── Header: Title, Model Badge, Status Badge ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-navy/10 text-primary-navy flex items-center justify-center shrink-0">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-text-main leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-medium">
              <Sparkles size={12} className="text-primary-navy" />
              <span>{modelName}</span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {typeof lastUpdated === "string" ? lastUpdated : lastUpdated.toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {status && (
          <div className="self-start sm:self-auto">
            <StatusBadge status={status} size="md" />
          </div>
        )}
      </div>

      {/* ── Confidence Score Strip (Progress Bar) ──────────────────────── */}
      <div className="bg-bg-base/70 p-3.5 rounded-xl border border-border-subtle space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-text-main flex items-center gap-1.5">
            <span>{confidenceLabel}</span>
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${scoreBadgeBg}`}
            >
              {confidenceTrustText}
            </span>
            <span className={`font-black font-mono text-sm ${scoreTextColor}`}>
              {score}%
            </span>
          </div>
        </div>

        {/* Accessible Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={confidenceLabel}
          className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* ── Extracted Clinical & Operational Entities (Checklist) ──────── */}
      {detectedEntities && detectedEntities.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              पहचाने गए मुख्य घटक (Extracted Clinical Entities)
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {detectedEntities.length} घटक सत्यापित
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {detectedEntities.map((entity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs bg-bg-base/60 p-3 rounded-lg border border-border-subtle transition-colors hover:bg-slate-100/70"
              >
                {renderCategoryIcon(entity.category)}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                    {entity.label}
                  </div>
                  <div className="font-bold text-text-main break-words mt-0.5">
                    {entity.value}
                  </div>
                </div>
                <span className="text-xs font-bold text-green-800 bg-green-100 px-1.5 py-0.5 rounded shrink-0">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendation Block ───────────────────────────────────────── */}
      {recObj && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>📋 {recObj.title || "अनुशंसित अग्रिम कार्यवाही (Recommended Action)"}</span>
            </div>
            {recObj.department && (
              <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">
                विभाग: {recObj.department}
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-blue-950 font-semibold leading-relaxed">
            {recObj.action}
          </p>

          {recObj.steps && recObj.steps.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {recObj.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-950 font-medium">
                  <span className="font-bold text-blue-800 shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Collapsible / Structured Detailed Reasoning & SHAP ─────────── */}
      {(explanation || (thoughtProcess && thoughtProcess.length > 0) || shapParameters || sources.length > 0) && (
        <div className="border-t border-border-subtle pt-3.5 space-y-3">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-label="Toggle detailed reasoning and SHAP analysis"
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-primary-navy transition-colors cursor-pointer py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue rounded-md px-1"
          >
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary-navy" />
              <span>विस्तृत AI तर्क व व्याख्या (Explainability & Reasoning Chain)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
              <span>{showDetails ? "छुपाएं" : "देखें"}</span>
              {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </button>

          {showDetails && (
            <div className="space-y-3.5 pt-1 text-xs">
              {/* Primary Narrative Explanation */}
              {explanation && (
                <div className="bg-bg-base/70 p-3.5 rounded-lg border border-border-subtle text-slate-800 leading-relaxed font-medium">
                  {explanation}
                </div>
              )}

              {/* Step-by-Step Thought Process */}
              {thoughtProcess && thoughtProcess.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    प्रक्रिया चरण (Reasoning Steps):
                  </div>
                  <div className="space-y-1.5">
                    {thoughtProcess.map((tp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 bg-bg-base/60 p-2.5 rounded-lg border border-border-subtle"
                      >
                        <span className="font-mono font-bold text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-border-subtle">
                          0{idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-text-main">{tp.step}</div>
                          <div className="text-xs text-slate-600 mt-0.5 font-medium">{tp.detail}</div>
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
                    SHAP पैरामीटर्स (Feature Contributions):
                  </div>
                  <div className="divide-y divide-border-subtle bg-bg-base/60 rounded-lg border border-border-subtle p-2.5">
                    {Object.entries(shapParameters).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-2 text-xs">
                        <span className="text-slate-700 font-medium">{k}</span>
                        <span className="font-mono font-bold text-text-main bg-white px-2 py-0.5 rounded border border-border-subtle">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAG Citations */}
              {sources && sources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    प्रमाणित संदर्भ स्रोत (Knowledge Citations):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-bg-base text-slate-800 px-2.5 py-1 rounded-md text-xs border border-border-subtle font-semibold"
                      >
                        <FileText size={12} className="text-slate-500" />
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
      {actions && <div className="pt-2.5 border-t border-border-subtle">{actions}</div>}

      {/* ── Government Disclaimer Footer ───────────────────────────────── */}
      <div className="text-xs text-slate-500 italic pt-1.5 border-t border-border-subtle flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-slate-500 shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}

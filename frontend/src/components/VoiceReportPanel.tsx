import React, { useState, useEffect } from "react";
import {
  Mic,
  Volume2,
  CheckCircle2,
  Edit3,
  Languages,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  HelpCircle,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

export interface VoiceReportPanelProps {
  /** Recording duration formatted string e.g. "00:42" or seconds */
  recordingDuration?: string | number;
  timestamp?: string | Date;
  transcript: string;
  onTranscriptChange?: (newTranscript: string) => void;
  languageDetected?: string;
  sttConfidence?: number;
  detectedIntent?: string;
  extractedEntities?: Record<string, any>;
  agentResponse?: string;
  onPlayAudio?: () => void;
  isPlayingAudio?: boolean;
  onSubmitReport?: (transcript: string, entities: Record<string, any>) => void;
  onReset?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function formatIntentLabel(intent?: string): { label: string; sub: string; color: string } {
  switch (intent) {
    case "log_weight":
      return {
        label: "वजन व स्वास्थ्य रिकॉर्ड (Log Growth & Nutrition)",
        sub: "स्वास्थ्य रजिस्टर प्रविष्टि",
        color: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "get_activity_plan":
      return {
        label: "दैनिक गतिविधि योजना (Activity Planner)",
        sub: "पाठ्यचर्या सहायता",
        color: "bg-orange-50 text-orange-800 border-orange-200",
      };
    case "get_visit_schedule":
      return {
        label: "स्मार्ट गृह भेंट अनुसूची (Home Visit Schedule)",
        sub: "प्राथमिकता क्रम",
        color: "bg-bg-base text-primary-navy border-border-subtle",
      };
    case "generate_mpr":
      return {
        label: "मासिक प्रगति रिपोर्ट (MPR Generator)",
        sub: "प्रशासनिक रिपोर्ट",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "general_query":
    default:
      return {
        label: "सामान्य पोषण व ICDS मार्गदर्शन (General Guidance)",
        sub: "प्रोटोकॉल परामर्श",
        color: "bg-slate-50 text-slate-800 border-slate-200",
      };
  }
}

export function formatEntityKey(key: string): string {
  switch (key) {
    case "child_name":
      return "लाभार्थी बालक/बालिका (Beneficiary Name)";
    case "weight_kg":
      return "मापा गया वजन / Weight";
    case "height_cm":
      return "ऊंचाई / Height";
    case "muac_cm":
      return "MUAC माप";
    case "centre":
      return "आंगनवाड़ी केंद्र";
    case "action":
      return "कार्यवाही संदर्भ";
    default:
      return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

export function formatEntityValue(key: string, value: any): string {
  if (key === "weight_kg") return `${value} kg (किलो)`;
  if (key === "height_cm") return `${value} cm (सेमी)`;
  if (key === "muac_cm") return `${value} cm`;
  return String(value);
}

export default function VoiceReportPanel({
  recordingDuration = "00:42",
  timestamp = new Date(),
  transcript,
  onTranscriptChange,
  languageDetected = "Hindi (हिन्दी)",
  sttConfidence = 94,
  detectedIntent = "log_weight",
  extractedEntities = {},
  agentResponse,
  onPlayAudio,
  isPlayingAudio = false,
  onSubmitReport,
  onReset,
  isSubmitting = false,
  className = "",
}: VoiceReportPanelProps) {
  const [editableTranscript, setEditableTranscript] = useState(transcript);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    setEditableTranscript(transcript);
    setIsEdited(false);
  }, [transcript]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditableTranscript(val);
    setIsEdited(val !== transcript);
    if (onTranscriptChange) {
      onTranscriptChange(val);
    }
  };

  const formattedTime =
    typeof timestamp === "string"
      ? timestamp
      : timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

  const intentMeta = formatIntentLabel(detectedIntent);
  const entitiesList = Object.entries(extractedEntities || {});

  const conf = Math.min(100, Math.max(0, sttConfidence));
  let confColor = "bg-green-600";
  let confTextColor = "text-green-800";
  if (conf < 75) {
    confColor = "bg-red-600";
    confTextColor = "text-red-800";
  } else if (conf < 88) {
    confColor = "bg-amber-500";
    confTextColor = "text-amber-900";
  }

  return (
    <div
      className={`bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs space-y-5 select-none ${className}`}
    >
      {/* ── Header Strip ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-navy/10 text-primary-navy flex items-center justify-center shrink-0">
            <Mic size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-text-main leading-tight">
              ध्वनि प्रतिलेखन व विश्लेषण (Voice STT Analysis)
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                <span>समय: {formattedTime}</span>
              </span>
              <span>•</span>
              <span>अवधि: {recordingDuration}s</span>
            </div>
          </div>
        </div>

        <div className="self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${intentMeta.color}`}
          >
            <Sparkles size={12} />
            <span>{intentMeta.sub}</span>
          </span>
        </div>
      </div>

      {/* ── Editable Live Transcript (Original Audio Input) ───────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="voice-transcript-input"
            className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Edit3 size={13} className="text-primary-navy" />
            <span>बोला गया मौखिक इनपुट (Transcribed Voice Query):</span>
          </label>
          {isEdited && (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              संपादित (Edited)
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            id="voice-transcript-input"
            rows={2}
            value={editableTranscript}
            onChange={handleTextChange}
            placeholder="बोला गया वाक्य यहां दिखाई देगा (संपादन हेतु टैप करें)..."
            aria-label="Editable Voice Transcript"
            className="input-gov font-medium leading-relaxed resize-y min-h-[64px]"
          />
        </div>
      </div>

      {/* ── Metadata Strip: Language, Confidence, Intent ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Language Detected */}
        <div className="bg-bg-base/70 p-3.5 rounded-xl border border-border-subtle space-y-1">
          <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
            <span>पहचानी गई भाषा</span>
            <Languages size={13} className="text-primary-navy" />
          </div>
          <div className="font-bold text-text-main text-xs truncate">
            {languageDetected}
          </div>
          <div className="text-xs text-slate-500">स्वतः पहचानी गई बोली</div>
        </div>

        {/* STT Confidence Score */}
        <div className="bg-bg-base/70 p-3.5 rounded-xl border border-border-subtle space-y-1">
          <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
            <span>STT विश्वास स्कोर</span>
            <Sparkles size={13} className="text-primary-navy" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-bold font-mono text-xs ${confTextColor}`}>
              {conf}% शुद्धता
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {conf >= 85 ? "उच्च" : "समीक्षित"}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${confColor}`}
              style={{ width: `${conf}%` }}
            />
          </div>
        </div>

        {/* Detected Intent */}
        <div className="bg-bg-base/70 p-3.5 rounded-xl border border-border-subtle space-y-1">
          <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
            <span>पहचाना गया मंतव्य</span>
            <FileCheck size={13} className="text-gov-blue" />
          </div>
          <div className="font-bold text-primary-navy text-xs truncate">
            {intentMeta.label}
          </div>
          <div className="text-xs text-slate-500 truncate">{intentMeta.sub}</div>
        </div>
      </div>

      {/* ── Extracted Entities Checklist (✓) ───────────────────────────── */}
      {entitiesList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              पहचाने गए घटक (Detected Entities Checklist)
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              NLP स्ट्रक्चर्ड डेटा
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entitiesList.map(([key, val]) => (
              <div
                key={key}
                className="flex items-start gap-2.5 text-xs bg-bg-base/60 p-3 rounded-lg border border-border-subtle"
              >
                <CheckCircle2 size={15} className="text-success-green shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {formatEntityKey(key)}
                  </div>
                  <div className="font-bold text-text-main break-words mt-0.5">
                    {formatEntityValue(key, val)}
                  </div>
                </div>
                <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded shrink-0">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AROMI Response Preview ─────────────────────────────────────── */}
      {agentResponse && (
        <div className="bg-primary-light/50 border border-primary/20 rounded-xl p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary-navy font-bold">
              <Volume2 size={16} />
              <span>AROMI का जवाब (Assistant Response):</span>
            </div>
            {onPlayAudio && (
              <button
                type="button"
                onClick={onPlayAudio}
                aria-label={isPlayingAudio ? "Audio playing" : "Listen to audio response"}
                className="text-xs font-bold text-primary-navy hover:text-gov-blue flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-border-subtle shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
              >
                <Volume2 size={13} />
                <span>{isPlayingAudio ? "बोल रहा है..." : "ध्वनि सुनें"}</span>
              </button>
            )}
          </div>
          <p className="text-xs md:text-sm text-text-main font-semibold leading-relaxed">
            {agentResponse}
          </p>
        </div>
      )}

      {/* ── Actions Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2.5 border-t border-border-subtle">
        {onPlayAudio && (
          <button
            type="button"
            onClick={onPlayAudio}
            aria-label="Listen to voice response again"
            className="btn-secondary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Volume2 size={15} className="text-slate-600" />
            <span>पुनः सुनें (Listen Again)</span>
          </button>
        )}

        {onSubmitReport && (
          <button
            type="button"
            onClick={() => onSubmitReport(editableTranscript, extractedEntities)}
            disabled={isSubmitting}
            aria-label="Submit report and log record to register"
            className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>सहेज रहे हैं...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>रिपोर्ट सहेजें व रिकॉर्ड दर्ज करें (Submit Report)</span>
              </>
            )}
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Start new voice input"
            className="py-2.5 px-4 text-xs bg-bg-base hover:bg-slate-200 text-slate-800 rounded-lg font-semibold border border-border-subtle transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
          >
            नया इनपुट (New Input)
          </button>
        )}
      </div>

      {/* ── Disclaimer Footer ──────────────────────────────────── */}
      <div className="text-xs text-slate-500 italic pt-1.5 border-t border-border-subtle flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-slate-500 shrink-0" />
        <span>
          यह ध्वनि विश्लेषण स्वचालित रूप से तैयार किया गया है। पुष्टि करने से पूर्व प्रतिलेखन की शुद्धता जांच लें।
        </span>
      </div>
    </div>
  );
}

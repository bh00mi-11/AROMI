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
  // TODO: Backend integration - dynamic language detected key from Whisper
  languageDetected?: string;
  // TODO: Backend integration - STT confidence score from Whisper segments
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
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "get_activity_plan":
      return {
        label: "दैनिक गतिविधि योजना (Activity Planner)",
        sub: "पाठ्यचर्या सहायता",
        color: "bg-orange-50 text-orange-700 border-orange-200",
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
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "general_query":
    default:
      return {
        label: "सामान्य पोषण व ICDS मार्गदर्शन (General Guidance)",
        sub: "प्रोटोकॉल परामर्श",
        color: "bg-slate-50 text-slate-700 border-slate-200",
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
  // TODO: Backend integration - Whisper detected language metadata
  languageDetected = "Hindi (हिन्दी)",
  // TODO: Backend integration - Whisper token probability / confidence
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
  }, [transcript]);

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setEditableTranscript(newVal);
    setIsEdited(newVal !== transcript);
    if (onTranscriptChange) {
      onTranscriptChange(newVal);
    }
  };

  const intentMeta = formatIntentLabel(detectedIntent);

  // STT score styling
  const conf = Math.min(100, Math.max(0, sttConfidence));
  const confColor = conf >= 85 ? "bg-green-600" : conf >= 65 ? "bg-amber-500" : "bg-red-500";
  const confTextColor = conf >= 85 ? "text-green-700" : conf >= 65 ? "text-amber-700" : "text-red-700";

  const entitiesList = Object.entries(extractedEntities).filter(
    ([_, v]) => v !== undefined && v !== null && v !== ""
  );

  const formattedTime =
    typeof timestamp === "string"
      ? timestamp
      : timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const durationStr =
    typeof recordingDuration === "number"
      ? `${String(Math.floor(recordingDuration / 60)).padStart(2, "0")}:${String(
          recordingDuration % 60
        ).padStart(2, "0")}`
      : recordingDuration;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs space-y-4 select-none transition-opacity duration-200 ease-out ${className}`}
    >
      {/* ── Header: Title, Duration Badge, Timestamp ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 border border-orange-200/80 text-primary">
            <Mic size={17} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>🎙 ध्वनि इनपुट रिपोर्ट (Voice STT Report)</span>
            </h3>
            <div className="text-[10px] text-gray-400">
              Whisper STT v3 Multilingual + NLP Entity Extractor
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-orange-50 text-primary font-mono font-bold px-2.5 py-1 rounded-md border border-orange-200/80 flex items-center gap-1">
            <Clock size={12} />
            <span>रिकॉर्डिंग: {durationStr}</span>
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-1 rounded-md border border-gray-200">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* ── Editable Whisper STT Transcript ────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Edit3 size={13} className="text-primary" />
            <span>प्रतिलेखन (Whisper STT Transcription) — संपादन योग्य:</span>
          </label>
          {isEdited ? (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              संशोधित प्रतिलेखन (Edited)
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">
              अधिकारी द्वारा सुधार हेतु संपादन योग्य
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            value={editableTranscript}
            onChange={handleTranscriptChange}
            rows={3}
            className="input-gov w-full font-medium leading-relaxed resize-none text-xs md:text-sm"
            placeholder="प्रतिलेखित वाक्य यहाँ दिखेगा..."
          />
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/90 px-1.5 rounded">
            {editableTranscript.length} अक्षर
          </div>
        </div>
      </div>

      {/* ── Metadata Strip: Language, Confidence, Intent ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Language Detected */}
        <div className="bg-gray-50/90 p-3 rounded-xl border border-gray-200/70 space-y-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
            <span>पहचानी गई भाषा</span>
            <Languages size={12} className="text-primary" />
          </div>
          <div className="font-bold text-gray-800 text-xs truncate">
            {languageDetected}
          </div>
          <div className="text-[10px] text-gray-400">स्वतः पहचानी गई बोली</div>
        </div>

        {/* STT Confidence Score */}
        <div className="bg-gray-50/90 p-3 rounded-xl border border-gray-200/70 space-y-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
            <span>STT विश्वास स्कोर</span>
            <Sparkles size={12} className="text-primary" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-bold font-mono text-xs ${confTextColor}`}>
              {conf}% शुद्धता
            </span>
            <span className="text-[10px] text-gray-500">
              {conf >= 85 ? "उच्च" : "समीक्षित"}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${confColor}`}
              style={{ width: `${conf}%` }}
            />
          </div>
        </div>

        {/* Detected Intent */}
        <div className="bg-gray-50/90 p-3 rounded-xl border border-gray-200/70 space-y-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
            <span>पहचाना गया मंतव्य</span>
            <FileCheck size={12} className="text-blue-500" />
          </div>
          <div className="font-bold text-blue-900 text-xs truncate">
            {intentMeta.label}
          </div>
          <div className="text-[10px] text-gray-400 truncate">{intentMeta.sub}</div>
        </div>
      </div>

      {/* ── Extracted Entities Checklist (✓) ───────────────────────────── */}
      {entitiesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              पहचाने गए घटक (Detected Entities Checklist)
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              NLP स्ट्रक्चर्ड डेटा
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entitiesList.map(([key, val]) => (
              <div
                key={key}
                className="flex items-start gap-2 text-xs bg-slate-50/90 p-2.5 rounded-lg border border-slate-200/80"
              >
                <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    {formatEntityKey(key)}
                  </div>
                  <div className="font-semibold text-gray-800 break-words mt-0.5">
                    {formatEntityValue(key, val)}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded shrink-0">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AROMI Response Preview ─────────────────────────────────────── */}
      {agentResponse && (
        <div className="bg-primary-light border border-orange-200/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <Volume2 size={15} />
              <span>AROMI का जवाब (Assistant Response):</span>
            </div>
            {onPlayAudio && (
              <button
                type="button"
                onClick={onPlayAudio}
                className="text-[11px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-orange-200 shadow-2xs"
              >
                <Volume2 size={12} />
                <span>{isPlayingAudio ? "बोल रहा है..." : "ध्वनि सुनें"}</span>
              </button>
            )}
          </div>
          <p className="text-xs md:text-sm text-gray-800 font-medium leading-relaxed">
            {agentResponse}
          </p>
        </div>
      )}

      {/* ── Actions Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-gray-100">
        {onPlayAudio && (
          <button
            type="button"
            onClick={onPlayAudio}
            className="btn-secondary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Volume2 size={14} className="text-gray-600" />
            <span>पुनः सुनें (Listen Again)</span>
          </button>
        )}

        {onSubmitReport && (
          <button
            type="button"
            onClick={() => onSubmitReport(editableTranscript, extractedEntities)}
            disabled={isSubmitting}
            className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>सहेज रहे हैं...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>रिपोर्ट सहेजें व रिकॉर्ड दर्ज करें (Submit Report)</span>
              </>
            )}
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="py-2.5 px-4 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold border border-gray-200 transition-colors cursor-pointer"
          >
            नया इनपुट (New Input)
          </button>
        )}
      </div>

      {/* ── Disclaimer Footer ──────────────────────────────────────────── */}
      <div className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100 flex items-center gap-1.5">
        <ShieldCheck size={12} className="text-gray-400 shrink-0" />
        <span>
          यह ध्वनि विश्लेषण स्वचालित रूप से तैयार किया गया है। पुष्टि करने से पूर्व प्रतिलेखन की शुद्धता जांच लें।
        </span>
      </div>
    </div>
  );
}

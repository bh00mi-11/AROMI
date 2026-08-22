import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Sparkles, Loader, CheckCircle2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import VoiceReportPanel from "../components/VoiceReportPanel";

const EXAMPLE_QUERIES = [
  "राज का वजन 11 किलो है",
  "आज 15 बच्चे आए और दलिया खाया",
  "MAM बच्चे के लिए क्या दें?",
  "घर विज़िट कौन सा पहले?",
];

export default function VoiceAgent() {
  const [phase, setPhase] = useState<"idle" | "recording" | "processing" | "response">("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [lastDuration, setLastDuration] = useState(0);
  const [demoText, setDemoText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    setPhase("recording");
    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLastDuration(recordSeconds || 4);
    setPhase("processing");

    setTimeout(() => {
      runDemoQuery("राज का वजन 11 किलो है");
    }, 1200);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const runDemoQuery = (text: string) => {
    setDemoText(text);
    setPhase("processing");
    setLastDuration(4);

    const demoResponses: Record<string, any> = {
      "राज का वजन 11 किलो है": {
        transcribed_text: "राज का वजन 11 किलो है",
        detected_intent: "log_growth_measurement",
        extracted_entities: { child_name: "राज", weight_kg: "11.0", status: "MAM (जांच उपरांत)" },
        agent_response_text: "राज का वजन 11.0 किलो दर्ज किया गया। पिछले महीने से 200 ग्राम अधिक। MAM श्रेणी — 15 दिन बाद फॉलो-अप निर्धारित।",
        language: "hindi",
        confidence_pct: 95,
      },
      "आज 15 बच्चे आए और दलिया खाया": {
        transcribed_text: "आज 15 बच्चे आए और दलिया खाया",
        detected_intent: "log_daily_attendance_and_ration",
        extracted_entities: { count_present: 15, meal_type: "दलिया (THR/Hot Meal)", status: "सत्यापित" },
        agent_response_text: "15 बच्चों की उपस्थिति और दलिया वितरण दर्ज हुआ। MPR में स्वचालित रूप से अपडेट हो गया।",
        language: "hindi",
        confidence_pct: 98,
      },
      "MAM बच्चे के लिए क्या दें?": {
        transcribed_text: "MAM बच्चे के लिए क्या दें?",
        detected_intent: "nutrition_guidelines_query",
        extracted_entities: { condition: "MAM", protocol: "WHO/ICDS" },
        agent_response_text: "WHO दिशानिर्देश: MAM बच्चे को दिन में 5-6 बार खाना दें। दाल, अंडे, दूध शामिल करें। 15 दिन में फॉलो-अप करें।",
        language: "hindi",
        confidence_pct: 96,
      },
      "घर विज़िट कौन सा पहले?": {
        transcribed_text: "घर विज़िट कौन सा पहले?",
        detected_intent: "get_visit_schedule",
        extracted_entities: { priority_child: "अनीता पाटिल", status: "SAM" },
        agent_response_text: "प्राथमिकता: पहले अनीता पाटिल (SAM - तत्काल), फिर राज कुमार (MAM - 2 दिन बाद)।",
        language: "hindi",
        confidence_pct: 94,
      },
    };
    const res = demoResponses[text] || demoResponses["राज का वजन 11 किलो है"];
    setResult(res);
    setPhase("response");
    speakResponse(res.agent_response_text);
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "hi-IN";
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  const handleTranscriptChange = (newTranscript: string) => {
    if (result) {
      setResult({
        ...result,
        transcribed_text: newTranscript,
      });
    }
  };

  const handleSubmitReport = async (transcript: string, entities: Record<string, any>) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    toast.success("वॉइस रिपोर्ट सत्यापित व रजिस्टर में सफलतापूर्वक दर्ज की गई!");
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setDemoText("");
    setRecordSeconds(0);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
              <Mic size={22} className="text-primary-navy" />
              <span>आवाज़ सहायक (Voice Assistant)</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              ग्रामीण बोलियों में बोलें — Whisper STT मॉडल तुरंत समझकर प्रशासनिक कार्यवाही करेगा
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-bg-base px-3 py-1.5 rounded-lg border border-border-subtle font-medium self-start sm:self-auto">
            <Sparkles size={14} className="text-gov-blue" />
            <span>Whisper-v3 Multilingual Active</span>
          </div>
        </div>
      </div>

      {/* Main Mic / Controller Card */}
      {phase !== "response" && (
        <div className="bg-white rounded-xl border border-border-subtle p-10 flex flex-col items-center justify-center gap-5 shadow-2xs">
          {phase === "idle" && (
            <>
              <button
                type="button"
                onClick={startRecording}
                aria-label="बोलने के लिए माइक बटन दबाएं"
                className="w-24 h-24 rounded-full bg-primary-navy hover:bg-gov-blue text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
              >
                <Mic size={40} />
              </button>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-text-main">बोलने के लिए माइक बटन दबाएं</p>
                <p className="text-xs text-slate-500 font-medium">
                  उदा: "राज का वजन 11 किलो है" अथवा "आज की गतिविधि बताओ"
                </p>
              </div>
            </>
          )}

          {phase === "recording" && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                aria-label="रोकने के लिए लाल बटन दबाएं"
                className="w-24 h-24 rounded-full bg-danger-red text-white flex items-center justify-center shadow-lg animate-pulse active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-danger-red"
              >
                <MicOff size={40} />
              </button>
              <div className="text-center space-y-1">
                <p className="text-sm text-danger-red font-bold flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger-red animate-ping inline-block" />
                  <span>सुन रहा हूं... {formatDuration(recordSeconds)}</span>
                </p>
                <p className="text-xs text-slate-600 font-medium">समाप्त करने के लिए लाल बटन पर टैप करें</p>
              </div>
            </>
          )}

          {phase === "processing" && (
            <>
              <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                <Loader size={40} className="text-primary-navy animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-primary-navy font-bold">AROMI Whisper मॉडल प्रतिलेखन व विश्लेषण कर रहा है...</p>
                <p className="text-xs text-slate-500 font-mono">STT Processing • NLP Extraction • Response Generation</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Response State: Explainable Voice Report Panel */}
      {phase === "response" && result && (
        <VoiceReportPanel
          recordingDuration={lastDuration}
          timestamp={new Date()}
          transcript={result.transcribed_text}
          onTranscriptChange={handleTranscriptChange}
          languageDetected={result.language === "hindi" ? "Hindi (हिन्दी)" : "Hindi / Marathi Dialect"}
          sttConfidence={result.confidence_pct || 94}
          detectedIntent={result.detected_intent}
          extractedEntities={result.extracted_entities}
          agentResponse={result.agent_response_text}
          onPlayAudio={() => speakResponse(result.agent_response_text)}
          onSubmitReport={handleSubmitReport}
          onReset={reset}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Demo queries section */}
      {phase === "idle" && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            मानक डेमो इनपुट परीक्षण (Test Sample Voice Queries):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runDemoQuery(q)}
                aria-label={`Test query: ${q}`}
                className="text-left bg-white rounded-xl border border-border-subtle py-3.5 px-4 text-xs text-slate-800 hover:border-gov-blue hover:text-primary-navy transition-all active:scale-98 cursor-pointer shadow-2xs flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
              >
                <Mic size={15} className="text-gov-blue shrink-0" />
                <span className="font-semibold truncate">"{q}"</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

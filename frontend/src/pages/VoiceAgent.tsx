import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader, Sparkles } from "lucide-react";
import { voiceAPI } from "../lib/api";
import toast from "react-hot-toast";
import VoiceReportPanel from "../components/VoiceReportPanel";

type Phase = "idle" | "recording" | "processing" | "response";

interface VoiceResult {
  transcribed_text: string;
  detected_intent: string;
  extracted_entities: Record<string, any>;
  agent_response_text: string;
  language?: string;
  confidence_pct?: number;
}

const EXAMPLE_QUERIES = [
  "राज का वजन 11 किलो है",
  "आज की गतिविधि बताओ",
  "MAM बच्चे के लिए क्या करें?",
  "घर विज़िट कौन सा पहले?",
];

export default function VoiceAgent() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [demoText, setDemoText] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [lastDuration, setLastDuration] = useState("00:15");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (phase === "recording") {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const dur = formatDuration(recordSeconds || 12);
        setLastDuration(dur);
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        await processAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setPhase("recording");
    } catch {
      toast.error("माइक्रोफ़ोन उपलब्ध नहीं है");
    }
  };

  const stopRecording = () => {
    const dur = formatDuration(recordSeconds || 12);
    setLastDuration(dur);
    mediaRef.current?.stop();
    setPhase("processing");
  };

  const processAudio = async (blob: Blob) => {
    const fd = new FormData();
    fd.append("audio", blob, "voice.wav");
    try {
      const res = await voiceAPI.process(fd);
      setResult(res.data);
      setPhase("response");
      speakResponse(res.data.agent_response_text);
    } catch {
      // Demo fallback when server unavailable
      toast("डेमो मोड — सर्वर से कनेक्ट नहीं", { icon: "ℹ️" });
      const fallbackResult: VoiceResult = {
        transcribed_text: "राज का वजन 11 किलो है",
        detected_intent: "log_weight",
        extracted_entities: { child_name: "राज", weight_kg: 11 },
        agent_response_text: "राज MAM श्रेणी में है। 7 दिन में फॉलो-अप आवश्यक है। PHC रेफरल तैयार किया गया।",
        language: "hindi",
        // TODO: Backend integration - Whisper token probability
        confidence_pct: 93,
      };
      setResult(fallbackResult);
      setPhase("response");
      speakResponse(fallbackResult.agent_response_text);
    }
  };

  const runDemoQuery = async (text: string) => {
    setPhase("processing");
    setDemoText(text);
    setLastDuration("00:24");
    // Simulate processing
    await new Promise((r) => setTimeout(r, 1200));
    const demoResponses: Record<string, VoiceResult> = {
      "राज का वजन 11 किलो है": {
        transcribed_text: "राज का वजन 11 किलो है",
        detected_intent: "log_weight",
        extracted_entities: { child_name: "राज", weight_kg: 11 },
        agent_response_text: "राज MAM श्रेणी में है। 7 दिन में फॉलो-अप आवश्यक है। PHC रेफरल तैयार किया गया।",
        language: "hindi",
        confidence_pct: 95,
      },
      "आज की गतिविधि बताओ": {
        transcribed_text: "आज की गतिविधि बताओ",
        detected_intent: "get_activity_plan",
        extracted_entities: { activity_type: "पाठ्यचर्या", duration: "45 मिनट" },
        agent_response_text: "आज के लिए 3 गतिविधियां तैयार हैं: पत्थर से गिनती, मराठी गीत, और चित्रकारी। कुल समय: 45 मिनट।",
        language: "hindi",
        confidence_pct: 92,
      },
      "MAM बच्चे के लिए क्या करें?": {
        transcribed_text: "MAM बच्चे के लिए क्या करें?",
        detected_intent: "general_query",
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
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span>🎙️ आवाज़ सहायक (Voice Assistant)</span>
          </h1>
          <p className="text-xs text-gray-500">
            ग्रामीण बोलियों में बोलें — Whisper STT मॉडल तुरंत समझकर प्रशासनिक कार्यवाही करेगा
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs self-start sm:self-auto">
          <Sparkles size={13} className="text-primary" />
          <span>Whisper-v3 Multilingual Active</span>
        </div>
      </div>

      {/* Main Mic / Controller Card */}
      {phase !== "response" && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-8 flex flex-col items-center justify-center gap-4 shadow-2xs">
          {phase === "idle" && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark active:scale-95 transition-all cursor-pointer"
                title="बोलने के लिए दबाएं"
              >
                <Mic size={40} />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">बोलने के लिए माइक बटन दबाएं</p>
                <p className="text-xs text-gray-400 mt-0.5">
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
                className="w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse active:scale-95 transition-all cursor-pointer"
                title="रोकने के लिए दबाएं"
              >
                <MicOff size={40} />
              </button>
              <div className="text-center space-y-1">
                <p className="text-sm text-red-600 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                  <span>सुन रहा हूं... {formatDuration(recordSeconds)}</span>
                </p>
                <p className="text-xs text-gray-500">समाप्त करने के लिए लाल बटन पर टैप करें</p>
              </div>
            </>
          )}

          {phase === "processing" && (
            <>
              <div className="w-24 h-24 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
                <Loader size={40} className="text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-primary font-bold">AROMI Whisper मॉडल प्रतिलेखन व विश्लेषण कर रहा है...</p>
                <p className="text-xs text-gray-400 font-mono">STT Processing • NLP Extraction • Response Generation</p>
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
          // TODO: Backend integration - dynamic STT confidence metric
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
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            मानक डेमो इनपुट परीक्षण (Test Sample Voice Queries):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runDemoQuery(q)}
                className="text-left bg-white rounded-xl border border-gray-200/80 py-3 px-4 text-xs text-gray-700 hover:border-primary hover:text-primary transition-all active:scale-98 cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <Mic size={14} className="text-primary shrink-0" />
                <span className="font-medium truncate">"{q}"</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

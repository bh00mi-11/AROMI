import { useState, useRef } from "react";
import { Mic, MicOff, Volume2, Loader } from "lucide-react";
import { voiceAPI } from "../lib/api";
import toast from "react-hot-toast";

type Phase = "idle" | "recording" | "processing" | "response";

interface VoiceResult {
  transcribed_text: string;
  detected_intent: string;
  extracted_entities: Record<string, any>;
  agent_response_text: string;
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
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
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
      setPhase("idle");
    }
  };

  const runDemoQuery = async (text: string) => {
    setPhase("processing");
    setDemoText(text);
    // Simulate processing
    await new Promise((r) => setTimeout(r, 1500));
    const demoResponses: Record<string, VoiceResult> = {
      "राज का वजन 11 किलो है": {
        transcribed_text: "राज का वजन 11 किलो है",
        detected_intent: "log_weight",
        extracted_entities: { child_name: "राज", weight_kg: 11 },
        agent_response_text: "राज MAM श्रेणी में है। 7 दिन में फॉलो-अप आवश्यक है। PHC रेफरल तैयार किया गया।",
      },
      "आज की गतिविधि बताओ": {
        transcribed_text: "आज की गतिविधि बताओ",
        detected_intent: "get_activity_plan",
        extracted_entities: {},
        agent_response_text: "आज के लिए 3 गतिविधियां तैयार हैं: पत्थर से गिनती, मराठी गीत, और चित्रकारी। कुल समय: 45 मिनट।",
      },
      "MAM बच्चे के लिए क्या करें?": {
        transcribed_text: "MAM बच्चे के लिए क्या करें?",
        detected_intent: "general_query",
        extracted_entities: {},
        agent_response_text: "WHO दिशानिर्देश: MAM बच्चे को दिन में 5-6 बार खाना दें। दाल, अंडे, दूध शामिल करें। 15 दिन में फॉलो-अप करें।",
      },
      "घर विज़िट कौन सा पहले?": {
        transcribed_text: "घर विज़िट कौन सा पहले?",
        detected_intent: "get_visit_schedule",
        extracted_entities: {},
        agent_response_text: "प्राथमिकता: पहले अनीता पाटिल (SAM - तत्काल), फिर राज कुमार (MAM - 2 दिन बाद)।",
      },
    };
    setResult(demoResponses[text] || demoResponses["राज का वजन 11 किलो है"]);
    setPhase("response");
    speakResponse(demoResponses[text]?.agent_response_text || "");
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "hi-IN";
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  const reset = () => { setPhase("idle"); setResult(null); setDemoText(""); };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg">🎤 आवाज़ एजेंट</h1>
        <p className="text-xs text-gray-500">हिंदी में बोलें — AROMI समझेगा और जवाब देगा</p>
      </div>

      {/* Main mic button */}
      <div className="card flex flex-col items-center py-8 gap-4">
        {phase === "idle" && (
          <>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark active:scale-95 transition-all"
            >
              <Mic size={40} />
            </button>
            <p className="text-sm text-gray-500">बोलने के लिए दबाएं</p>
          </>
        )}
        {phase === "recording" && (
          <>
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse"
            >
              <MicOff size={40} />
            </button>
            <p className="text-sm text-red-500 font-semibold">सुन रहा हूं... रोकने के लिए दबाएं</p>
          </>
        )}
        {phase === "processing" && (
          <>
            <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center">
              <Loader size={40} className="text-primary animate-spin" />
            </div>
            <p className="text-sm text-primary font-semibold">AROMI सोच रहा है...</p>
          </>
        )}
        {phase === "response" && result && (
          <div className="w-full space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">आपने कहा:</div>
              <div className="text-sm font-medium text-gray-700">"{result.transcribed_text}"</div>
            </div>
            <div className="bg-primary-light border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-primary" />
                <div className="text-xs text-primary font-semibold">AROMI का जवाब:</div>
              </div>
              <div className="text-sm text-gray-800 font-medium">{result.agent_response_text}</div>
            </div>
            {Object.keys(result.extracted_entities).length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-500 font-semibold mb-1">पहचानी गई जानकारी:</div>
                {Object.entries(result.extracted_entities).map(([k, v]) => (
                  <div key={k} className="text-xs text-gray-600">
                    {k}: <span className="font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => speakResponse(result.agent_response_text)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2">
                <Volume2 size={16} /> फिर सुनें
              </button>
              <button onClick={reset} className="btn-primary flex-1 py-2">नया सवाल</button>
            </div>
          </div>
        )}
      </div>

      {/* Demo queries */}
      {phase === "idle" && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">उदाहरण प्रश्न — टैप करें</div>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => runDemoQuery(q)}
              className="w-full text-left card py-3 px-4 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors active:scale-95"
            >
              🎤 "{q}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

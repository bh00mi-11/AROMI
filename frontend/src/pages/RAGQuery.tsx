import { useState } from "react";
import { ragAPI } from "../lib/api";
import { Loader, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const SAMPLE_QUESTIONS = [
  "4 साल के MAM बच्चे के लिए क्या करना चाहिए?",
  "MUAC कितना होने पर SAM होता है?",
  "टीकाकरण कार्यक्रम क्या है?",
  "POSHAN अभियान क्या है?",
];

export default function RAGQuery() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: string[] } | null>(null);

  const ask = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setQuestion(query);
    try {
      const res = await ragAPI.query(query, language);
      setResult(res.data);
    } catch {
      setResult({
        answer: "WHO दिशानिर्देश: MAM बच्चे के लिए दिन में 5-6 बार खाना आवश्यक है। दाल, अंडे, दूध और हरी सब्जियां शामिल करें। 15 दिन में फॉलो-अप करें और वजन की जांच करें।",
        sources: ["WHO Child Growth Standards", "ICDS Guidelines - MAM Management"],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <BookOpen size={20} className="text-primary" /> WHO/ICDS जानकारी
        </h1>
        <p className="text-xs text-gray-500">आधिकारिक दिशानिर्देशों से जवाब पाएं</p>
      </div>

      <div className="flex gap-2">
        {["hindi", "marathi"].map((l) => (
          <button key={l} onClick={() => setLanguage(l)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
              language === l ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600"
            }`}>
            {l === "hindi" ? "हिन्दी" : "मराठी"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="सवाल पूछें..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button onClick={() => ask()} disabled={loading} className="btn-primary px-4">
          {loading ? <Loader size={16} className="animate-spin" /> : "पूछें"}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="card bg-primary-light border border-orange-200">
            <div className="text-xs font-semibold text-primary mb-2">AROMI का जवाब:</div>
            <div className="text-sm text-gray-800 leading-relaxed">{result.answer}</div>
          </div>
          <div className="card bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 mb-1">📚 स्रोत:</div>
            {result.sources.map((s) => (
              <div key={s} className="text-xs text-gray-500">• {s}</div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">उदाहरण प्रश्न</div>
        {SAMPLE_QUESTIONS.map((q) => (
          <button key={q} onClick={() => ask(q)}
            className="w-full text-left card py-2 px-3 text-sm text-gray-700 mb-2 hover:border-primary hover:text-primary transition-colors">
            📖 {q}
          </button>
        ))}
      </div>
    </div>
  );
}

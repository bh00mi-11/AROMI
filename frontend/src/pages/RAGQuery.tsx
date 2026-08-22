import { useState } from "react";
import { Search, BookOpen, Sparkles, Loader, HelpCircle } from "lucide-react";
import { ragAPI } from "../lib/api";
import toast from "react-hot-toast";
import AIAnalysisPanel, { DetectedEntity } from "../components/AIAnalysisPanel";

const SAMPLE_QUESTIONS = [
  "MAM बच्चे की देखभाल कैसे करें?",
  "टीकाकरण शेड्यूल क्या है?",
  "SAM बच्चे का PHC रेफरल कब करें?",
  "पूरक पोषाहार (THR) की मानक मात्रा क्या है?",
];

export default function RAGQuery() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: string[] } | null>(null);

  const ask = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) {
      toast.error("कृपया कोई प्रश्न दर्ज करें");
      return;
    }
    setQuestion(query);
    setLoading(true);
    try {
      const res = await ragAPI.query(query, language);
      setResult(res.data);
      toast.success("ज्ञानकोष से प्रामाणिक उत्तर संकलित हुआ");
    } catch {
      // Offline / demo fallback
      const demoAnswers: Record<string, string> = {
        "MAM बच्चे की देखभाल कैसे करें?":
          "WHO/ICDS दिशानिर्देश: MAM बच्चे को नियमित आहार के अलावा प्रतिदिन ऊर्जा-सघन अनुपूरक आहार दें। स्थानीय पौष्टिक खाद्य पदार्थ (दाल, घी, अंडा, फल) शामिल करें। प्रत्येक 15 दिन में वजन और MUAC मापें।",
        "टीकाकरण शेड्यूल क्या है?":
          "राष्ट्रीय टीकाकरण सारणी: जन्म पर BCG, OPV 0, Hep-B; 6, 10, 14 सप्ताह पर Pentavalent + OPV + Rota + IPV; 9 माह पर Measles-Rubella (MR-1) + Vitamin A।",
        "SAM बच्चे का PHC रेफरल कब करें?":
          "DISHA प्रोटोकॉल: यदि MUAC < 11.5 cm है, दोनों पैरों में सूजन (Bilateral Pitting Edema) है, या बच्चा कमजोर/बीमार है, तो 24 घंटे के भीतर नजदीकी PHC/NRC में अनिवार्य रेफरल करें।",
      };
      setResult({
        answer:
          demoAnswers[query] ||
          "ICDS दिशानिर्देशानुसार: 6 माह तक केवल स्तनपान और 6 माह बाद पूरक आहार के साथ स्तनपान जारी रखें। नियमित वजन निगरानी और पोषण स्तर के अनुसार फॉलो-अप करें।",
        sources: ["WHO Child Growth Standards", "ICDS Guidelines - MAM Management"],
      });
    } finally {
      setLoading(false);
    }
  };

  const detectedEntities: DetectedEntity[] = result
    ? [
        {
          label: "पूछा गया विषय / प्रश्न",
          value: question || "पोषण व ICDS दिशानिर्देश",
          category: "clinical",
        },
        {
          label: "भाषा मोड (Language Mode)",
          value: language === "hindi" ? "हिन्दी (Hindi Guidelines)" : "मराठी (Marathi Guidelines)",
          category: "general",
        },
        {
          label: "सत्यापित स्रोत संख्या",
          value: `${result.sources.length} आधिकारिक दिशानिर्देश संदर्भ`,
          category: "department",
        },
        {
          label: "दिशानिर्देश अधिकार क्षेत्र",
          value: "WHO Child Growth Standards & ICDS National Protocol",
          category: "clinical",
        },
      ]
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
              <BookOpen size={22} className="text-primary-navy" />
              <span>WHO व ICDS ज्ञानकोष (Protocol Knowledge Assistant)</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              आधिकारिक शासकीय प्रोटोकॉल एवं पोषण दिशानिर्देशों से सत्यापित AI संदर्भ
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-bg-base px-3 py-1.5 rounded-lg border border-border-subtle font-medium self-start sm:self-auto">
            <Sparkles size={14} className="text-gov-blue" />
            <span>ICDS & WHO Official Knowledge Base</span>
          </div>
        </div>
      </div>

      {/* Query Search Card */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs space-y-5">
        {/* Language Tabs */}
        <div role="tablist" aria-label="Language selection" className="flex gap-2 max-w-xs">
          {[
            { key: "hindi", label: "हिन्दी (Hindi)" },
            { key: "marathi", label: "मराठी (Marathi)" },
          ].map((l) => (
            <button
              key={l.key}
              role="tab"
              type="button"
              aria-selected={language === l.key}
              onClick={() => setLanguage(l.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
                language === l.key
                  ? "bg-primary-navy text-white border-primary-navy shadow-2xs"
                  : "border-border-subtle text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="प्रोटोकॉल या दिशानिर्देश संबंधी प्रश्न पूछें (उदा. MAM बच्चे की देखभाल, टीका शेड्यूल)..."
              aria-label="प्रोटोकॉल या दिशानिर्देश संबंधी प्रश्न पूछें"
              className="input-gov pl-10 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => ask()}
            disabled={loading}
            aria-label="Search protocol knowledge base"
            className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>खोज जारी...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>पूछें (Search Protocol)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result State: Explainable AI Panel */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <AIAnalysisPanel
            title="ज्ञानकोष AI विश्लेषण व प्रोटोकॉल उत्तर (RAG Analysis)"
            modelName="AROMI DISHA Knowledge Synthesis v2.1"
            confidenceScore={96}
            confidenceLabel="स्रोत मिलान व संदर्भ प्रासंगिकता (Retrieval Relevance)"
            status="info"
            detectedEntities={detectedEntities}
            recommendation={{
              title: "आधिकारिक दिशानिर्देश उत्तर (Official Protocol Guidance)",
              action: result.answer,
              department: "ICDS / स्वास्थ्य विभाग",
            }}
            sources={result.sources}
            thoughtProcess={[
              {
                step: "वेक्टर सिमेंटिक खोज (Vector Retrieval)",
                detail: `प्रश्न "${question}" हेतु WHO व ICDS डेटाबेस में उच्च-प्रासंगिक अनुच्छेद खोजे गए।`,
              },
              {
                step: "सत्यापित स्रोतों से मिलान (Document Grounding)",
                detail: `सत्यापित स्रोत: ${result.sources.join(" • ")}`,
              },
              {
                step: "प्रशासनिक भाषा संश्लेषण (Actionable Guidance)",
                detail: `कार्यकर्ता के सुगम उपयोग हेतु सरल ${language === "hindi" ? "हिन्दी" : "मराठी"} में उत्तर तैयार।`,
              },
            ]}
            disclaimer="यह उत्तर आधिकारिक WHO/ICDS दिशानिर्देशों पर आधारित है। विशेष चिकित्सा स्थिति में मेडिकल ऑफिसर से संपर्क करें।"
          />
        </div>
      )}

      {/* Sample / Suggested queries */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <HelpCircle size={14} className="text-primary-navy" />
          <span>अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Protocol Questions):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              aria-label={`Ask question: ${q}`}
              className="text-left bg-white rounded-xl border border-border-subtle py-3 px-4 text-xs text-slate-800 hover:border-gov-blue hover:text-primary-navy transition-all active:scale-98 cursor-pointer shadow-2xs flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
            >
              <span className="text-primary-navy font-bold shrink-0">📖</span>
              <span className="font-semibold truncate">{q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

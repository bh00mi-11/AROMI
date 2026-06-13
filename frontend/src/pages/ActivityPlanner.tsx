import { useState } from "react";
import { activityAPI } from "../lib/api";
import { Loader, Printer, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const LANG_OPTIONS = [
  { value: "hindi",   label: "हिन्दी" },
  { value: "marathi", label: "मराठी" },
];

const AGE_OPTIONS = ["2-3", "3-4", "4-5", "3-5", "4-6", "3-6"];

export default function ActivityPlanner() {
  const [ageGroup, setAgeGroup] = useState("3-5");
  const [childCount, setChildCount] = useState(6);
  const [language, setLanguage] = useState("hindi");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.generate({ age_group: ageGroup, child_count: childCount, language });
      setPlan(res.data.plan);
    } catch {
      // Demo fallback
      setPlan(DEMO_PLAN[language] || DEMO_PLAN.hindi);
      toast("डेमो प्लान दिखाया जा रहा है", { icon: "ℹ️" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg">✨ AI गतिविधि प्लानर</h1>
        <p className="text-xs text-gray-500">आज की सत्र योजना बनाएं</p>
      </div>

      {!plan ? (
        <div className="card space-y-4">
          {/* Language toggle */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-2">भाषा</label>
            <div className="flex gap-2">
              {LANG_OPTIONS.map((l) => (
                <button key={l.value} onClick={() => setLanguage(l.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    language === l.value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age group */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-2">उम्र समूह (वर्ष)</label>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((a) => (
                <button key={a} onClick={() => setAgeGroup(a)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    ageGroup === a ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600"
                  }`}>
                  {a} साल
                </button>
              ))}
            </div>
          </div>

          {/* Child count */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-2">
              आज के बच्चे: <span className="text-primary font-bold">{childCount}</span>
            </label>
            <input type="range" min={1} max={20} value={childCount}
              onChange={(e) => setChildCount(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <><Loader size={18} className="animate-spin" /> AROMI सोच रहा है...</> : "✨ गतिविधि बनाएं"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Language toggle on output screen */}
          <div className="flex gap-2">
            {LANG_OPTIONS.map((l) => (
              <button key={l.value}
                onClick={() => {
                  setLanguage(l.value);
                  // Switch to demo plan in new language, or regenerate
                  setPlan((DEMO_PLAN as any)[l.value] || (DEMO_PLAN as any).hindi);
                }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  language === l.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200"
                }`}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800">{plan.session_title}</div>
              <div className="text-xs text-gray-500">⏱ {plan.total_duration_minutes} मिनट · {childCount} बच्चे · {ageGroup} साल</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Printer size={16} className="text-gray-500" />
              </button>
              <button onClick={() => { navigator.share?.({ text: plan.session_title }); }}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Share2 size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {plan.activities?.map((act: any, i: number) => (
            <div key={i} className="card border-l-4 border-primary space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-800">{i + 1}. {act.name}</div>
                <div className="text-xs text-gray-400">⏱ {act.duration_minutes} मिनट</div>
              </div>
              <div className="text-xs text-primary bg-primary-light px-2 py-0.5 rounded-full w-fit">{act.type}</div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">सामग्री:</div>
                <div className="text-xs text-gray-600">{act.materials_needed?.join(", ")}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">चरण:</div>
                <ol className="space-y-1">
                  {act.steps?.map((s: string, j: number) => (
                    <li key={j} className="text-xs text-gray-700 flex gap-1">
                      <span className="text-primary font-bold flex-shrink-0">{j + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                🎯 {act.learning_objective}
              </div>
            </div>
          ))}

          {plan.tips_for_worker && (
            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="text-xs font-semibold text-yellow-700 mb-1">💡 सेविका के लिए सुझाव:</div>
              <div className="text-xs text-yellow-800">{plan.tips_for_worker}</div>
            </div>
          )}

          <div className="text-[10px] text-gray-400 text-center">{plan.offline_note}</div>
          <button onClick={() => setPlan(null)} className="btn-secondary w-full py-2">नई योजना बनाएं</button>
        </div>
      )}
    </div>
  );
}

const DEMO_PLAN = {
  hindi: {
    session_title: "आज का सत्र — रंग, गिनती और लय",
    total_duration_minutes: 45,
    activities: [
      {
        name: "पत्थर से गिनती",
        type: "game",
        duration_minutes: 15,
        materials_needed: ["10 छोटे पत्थर", "जमीन पर खींची गई रेखा"],
        steps: ["बच्चों को 2-2 के जोड़े में बिठाएं", "एक-एक पत्थर उठाकर गिनें", "1 से 10 तक गिनती बोलें", "जो पहले गिने उसे शाबाशी दें"],
        learning_objective: "1 से 10 तक गिनती सीखना",
      },
      {
        name: "मेंढक की छलांग",
        type: "motor",
        duration_minutes: 15,
        materials_needed: ["खुली जगह", "लकीरें (चाक या लकड़ी से)"],
        steps: ["जमीन पर 5 घेरे बनाएं", "मेंढक की तरह कूदकर घेरों में जाएं", "पूरी कक्षा साथ करे"],
        learning_objective: "मोटर स्किल और शरीर का संतुलन",
      },
      {
        name: "वर्षा गीत",
        type: "rhyme",
        duration_minutes: 15,
        materials_needed: ["कोई नहीं"],
        steps: ["बच्चों को गोल बिठाएं", "ताली बजाते हुए गाएं", "धीरे-धीरे सब साथ गाएं"],
        learning_objective: "भाषा विकास और याददाश्त",
      },
    ],
    tips_for_worker: "गतिविधि शुरू करने से पहले बच्चों को पानी पिलाएं। कमज़ोर बच्चों को पास बिठाएं।",
    offline_note: "यह योजना बिना इंटरनेट के भी उपयोग की जा सकती है",
  },
  marathi: {
    session_title: "आजचे सत्र — रंग, मोजणी आणि लय",
    total_duration_minutes: 45,
    activities: [
      {
        name: "दगडांनी मोजणी",
        type: "game",
        duration_minutes: 15,
        materials_needed: ["10 लहान दगड", "जमिनीवर काढलेली रेषा"],
        steps: ["मुलांना 2-2 च्या जोड्यांमध्ये बसवा", "एक-एक दगड उचलून मोजा", "1 ते 10 पर्यंत मोजणी सांगा"],
        learning_objective: "1 ते 10 पर्यंत मोजणी शिकणे",
      },
      {
        name: "बेडकाची उडी",
        type: "motor",
        duration_minutes: 15,
        materials_needed: ["मोकळी जागा"],
        steps: ["जमिनीवर 5 वर्तुळे काढा", "बेडकासारखी उडी मारून वर्तुळात जा"],
        learning_objective: "शरीराचे संतुलन आणि मोटर स्किल",
      },
      {
        name: "पाऊस गाणे",
        type: "rhyme",
        duration_minutes: 15,
        materials_needed: ["काही नाही"],
        steps: ["मुलांना गोल बसवा", "टाळ्या वाजवत गाणे गा", "हळूहळू सर्व एकत्र गाऊ लागतात"],
        learning_objective: "भाषा विकास आणि स्मरणशक्ती",
      },
    ],
    tips_for_worker: "गतिविधी सुरू करण्यापूर्वी मुलांना पाणी द्या.",
    offline_note: "ही योजना इंटरनेटशिवाय वापरता येते",
  },
};

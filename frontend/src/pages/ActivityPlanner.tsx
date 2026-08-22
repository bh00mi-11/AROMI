import { useState } from "react";
import {
  Activity,
  Sparkles,
  Printer,
  Share2,
  CheckCircle,
  Loader,
  Calendar,
  Users,
  Clock,
  BookOpen,
  Download,
  Layers,
  Globe,
  Tag,
} from "lucide-react";
import { activityAPI } from "../lib/api";
import toast from "react-hot-toast";
import { FormField, FormSection } from "../components/FormField";

const THEMES = [
  "रंग और आकार (Colors & Shapes)",
  "पशु और प्रकृति (Animals & Nature)",
  "संख्या और गणित (Numbers & Basic Math)",
  "शरीर और स्वच्छता (Body & Hygiene)",
  "मौसम और ऋतुएं (Seasons & Weather)",
  "भाषा और कहानियाँ (Language & Stories)",
];

const AGE_GROUPS = [
  { id: "3-6", label: "3-6 वर्ष (मिश्रित आयु)" },
  { id: "3-4", label: "3-4 वर्ष (प्रारंभिक)" },
  { id: "4-5", label: "4-5 वर्ष (मध्यम)" },
  { id: "5-6", label: "5-6 वर्ष (वरिष्ठ)" },
];

const DURATIONS = [
  { val: 30, label: "30 मिनट" },
  { val: 45, label: "45 मिनट (मानक)" },
  { val: 60, label: "60 मिनट" },
];

export default function ActivityPlanner() {
  const [ageGroup, setAgeGroup] = useState("3-6");
  const [theme, setTheme] = useState(THEMES[0]);
  const [duration, setDuration] = useState(45);
  const [childCount, setChildCount] = useState(15);
  const [language, setLanguage] = useState<"hindi" | "marathi">("hindi");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.generate({
        age_group: ageGroup,
        theme,
        duration_minutes: duration,
        child_count: childCount,
        language,
      });
      // Extract plan object if wrapped
      const planContent = res.data?.plan || res.data;
      setPlan(planContent);
      toast.success("दैनिक ईसीसीई पाठ योजना तैयार!");
    } catch (err) {
      console.error(err);
      toast.error("????? ????? ??? ???? (Failed to generate plan)");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!plan) return;
    setDownloading(true);
    try {
      await activityAPI.downloadPDF(plan);
      toast.success("अधिकृत ईसीसीई पाठ योजना PDF डाउनलोड पूर्ण!");
    } catch {
      toast.error("PDF डाउनलोड में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={22} className="text-primary-navy" />
              <h1 className="font-bold text-text-main text-lg md:text-xl">
                ईसीसीई दैनिक गतिविधि योजनाकार (ECCE Daily Activity Planner)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              राष्ट्रीय शिक्षा नीति (NEP 2020) एवं पोषण 2.0 अनुसार आयु-विशिष्ट दैनिक गतिविधि व खेल पाठ्यचर्या
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            मॉड्यूल: ECCE-NEP-2026
          </span>
        </div>
      </div>

      {!plan ? (
        <div className="bg-white p-5 md:p-7 rounded-xl border border-border-subtle shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary-navy" size={18} />
              <h2 className="text-sm md:text-base font-bold text-text-main">
                दैनिक पाठ योजना मापदंड (Daily Session Parameters)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              स्थानीय व सुलभ शिक्षण सामग्री आधारित
            </span>
          </div>

          <div className="space-y-6">
            {/* Section 1: Language & Theme */}
            <FormSection
              title="1. Language & Theme (भाषा एवं मुख्य विषय)"
              subtitle="पाठ्यक्रम की भाषा तथा सत्र का मुख्य विषय चुनें"
              icon={Globe}
            >
              <div className="space-y-4">
                <FormField label="पाठ्यक्रम भाषा (Language)" required helperText="सत्र योजना हेतु प्रयुक्त भाषा">
                  <div
                    role="radiogroup"
                    aria-label="Language selection"
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { id: "hindi", label: "🇮🇳 हिंदी (Hindi)" },
                      { id: "marathi", label: "🇮🇳 मराठी (Marathi)" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        aria-checked={language === l.id}
                        onClick={() => setLanguage(l.id as "hindi" | "marathi")}
                        className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue ${
                          language === l.id
                            ? "bg-primary-navy text-white border-primary-navy shadow-2xs"
                            : "bg-white text-slate-700 border-border-subtle hover:bg-slate-50"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField
                  label="दैनिक मुख्य विषय (Curriculum Theme)"
                  required
                  helperText="दैनिक शिक्षण हेतु निर्धारित विषयवस्तु"
                >
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="input-gov cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                  >
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Group and Duration */}
            <FormSection
              title="2. Group Profile & Duration (समूह विवरण एवं समय)"
              subtitle="बच्चों का आयु वर्ग, उपस्थिति संख्या और सत्र अवधि"
              icon={Users}
            >
              <div className="space-y-4">
                <FormField
                  label="आयु वर्ग (Age Group)"
                  required
                  helperText="सत्र में भाग लेने वाले बच्चों का आयु समूह"
                >
                  <div
                    role="radiogroup"
                    aria-label="Age group selection"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                  >
                    {AGE_GROUPS.map((ag) => (
                      <button
                        key={ag.id}
                        type="button"
                        role="radio"
                        aria-checked={ageGroup === ag.id}
                        onClick={() => setAgeGroup(ag.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue ${
                          ageGroup === ag.id
                            ? "bg-gov-blue text-white border-gov-blue shadow-2xs font-bold"
                            : "bg-white text-slate-700 border-border-subtle hover:bg-slate-50"
                        }`}
                      >
                        {ag.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <FormField
                    label="कुल उपस्थित बच्चे (Child Count)"
                    required
                    helperText="आज केंद्र में उपस्थित कुल बच्चे"
                  >
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={childCount}
                      onChange={(e) => setChildCount(Number(e.target.value))}
                      className="input-gov focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                    />
                  </FormField>

                  <FormField
                    label="सत्र कुल अवधि (Duration)"
                    required
                    helperText="दैनिक गतिविधि हेतु कुल समय"
                  >
                    <div
                      role="radiogroup"
                      aria-label="Duration selection"
                      className="grid grid-cols-3 gap-2"
                    >
                      {DURATIONS.map((d) => (
                        <button
                          key={d.val}
                          type="button"
                          role="radio"
                          aria-checked={duration === d.val}
                          onClick={() => setDuration(d.val)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue ${
                            duration === d.val
                              ? "bg-slate-800 text-white border-slate-800 shadow-2xs font-bold"
                              : "bg-white text-slate-700 border-border-subtle hover:bg-slate-50"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>
              </div>
            </FormSection>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAgeGroup("3-6");
                setTheme(THEMES[0]);
                setDuration(45);
                setChildCount(15);
              }}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
            >
              रीसेट करें (Reset Form)
            </button>

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
            >
              {loading ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  <span>AI पाठ योजना तैयार हो रही है...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>ईसीसीई दैनिक पाठ योजना जनरेट करें (Generate Plan)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 transition-opacity duration-200 ease-out">
          {/* Output Card */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-border-subtle shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
              <div>
                <div className="font-bold text-base md:text-lg text-text-main">
                  {plan.session_title || "दैनिक ईसीसीई पाठ्यचर्या सत्र"}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>⏱ कुल समय: <strong>{plan.total_duration_minutes || duration} मिनट</strong></span>
                  <span>•</span>
                  <span>समूह: <strong>{childCount} बच्चे ({ageGroup} वर्ष)</strong></span>
                  <span>•</span>
                  <span>भाषा: <strong>{language === "hindi" ? "हिंदी" : "मराठी"}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  title="अधिकृत शासकीय PDF डाउनलोड करें"
                  className="btn-primary px-3 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                >
                  {downloading ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>PDF डाउनलोड</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  title="प्रिंट करें"
                  className="p-2 rounded-lg border border-border-subtle text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                >
                  <Printer size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: plan.session_title,
                        text: `AROMI ईसीसीई दैनिक पाठ योजना — ${plan.session_title}`,
                      });
                    } else {
                      toast.success("पाठ योजना लिंक कॉपी किया गया");
                    }
                  }}
                  title="साझा करें"
                  className="p-2 rounded-lg border border-border-subtle text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Activities list */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <Layers size={14} className="text-primary-navy" />
                <span>निर्धारित गतिविधियाँ एवं क्रियान्वयन चरण (Scheduled Activities & Steps):</span>
              </div>

              <div className="space-y-3">
                {plan.activities?.map((act: any, i: number) => (
                  <div
                    key={i}
                    className="bg-bg-base rounded-xl border border-border-subtle p-4 space-y-2.5 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="font-bold text-sm text-text-main flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-navy text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span>{act.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-900 bg-amber-100 font-semibold px-2 py-0.5 rounded-md">
                          {act.type}
                        </span>
                        <span className="text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded border border-border-subtle">
                          ⏱ {act.duration_minutes} मिनट
                        </span>
                      </div>
                    </div>

                    {act.materials_needed && act.materials_needed.length > 0 && (
                      <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-border-subtle">
                        <strong className="text-slate-800">आवश्यक सामग्री (Materials):</strong>{" "}
                        {Array.isArray(act.materials_needed)
                          ? act.materials_needed.join(", ")
                          : act.materials_needed}
                      </div>
                    )}

                    {act.steps && act.steps.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-700">क्रियान्वयन चरण (Execution Steps):</div>
                        <ol className="space-y-1 pl-1">
                          {act.steps.map((s: string, j: number) => (
                            <li key={j} className="text-xs text-slate-700 flex gap-2">
                              <span className="text-gov-blue font-bold shrink-0">{j + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {act.learning_objective && (
                      <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-700 shrink-0" />
                        <span>
                          <strong>अधिगम प्रतिफल (Learning Objective):</strong> {act.learning_objective}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor tips */}
            {plan.tips_for_worker && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2">
                <span className="text-base leading-none shrink-0">💡</span>
                <div>
                  <strong>पर्यवेक्षक व कार्यकर्ता निर्देश (Facilitator Instructions):</strong>{" "}
                  <span className="text-amber-900">{plan.tips_for_worker}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                नवीन पाठ योजना प्रारंभ करें (Create New Plan)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_PLAN = {
  hindi: {
    session_title: "दैनिक पाठ्यचर्या सत्र — रंग, संख्या ज्ञान और लयबद्ध गतिविधि",
    total_duration_minutes: 45,
    activities: [
      {
        name: "पत्थर से गिनती व संख्या ज्ञान",
        type: "गणितीय कौशल",
        duration_minutes: 15,
        materials_needed: ["10 छोटे पत्थर", "जमीन पर खींची गई रेखा"],
        steps: [
          "बच्चों को 2-2 के जोड़े में बिठाएं",
          "एक-एक पत्थर उठाकर गिनें",
          "1 से 10 तक गिनती बोलें",
          "सक्रिय भागीदारी को प्रोत्साहित करें",
        ],
        learning_objective: "संख्यात्मक बोध व बुनियादी गणना कौशल",
      },
      {
        name: "मेंढक की छलांग व शारीरिक समन्वय",
        type: "स्थूल क्रियात्मक कौशल",
        duration_minutes: 15,
        materials_needed: ["खुला मैदान", "चाक से बने घेरे"],
        steps: [
          "जमीन पर 5 घेरे बनाएं",
          "मेंढक की तरह कूदकर घेरों में जाएं",
          "पूरी कक्षा को क्रमवार शामिल करें",
        ],
        learning_objective: "शारीरिक संतुलन और स्थूल मोटर विकास",
      },
      {
        name: "वर्षा गीत व सामूह गान",
        type: "भाषा व भावनात्मक विकास",
        duration_minutes: 15,
        materials_needed: ["कोई नहीं"],
        steps: [
          "बच्चों को गोल घेरे में बिठाएं",
          "लयबद्ध ताली के साथ गीत प्रस्तुत करें",
          "सामूहिक गान सुनिश्चित करें",
        ],
        learning_objective: "शब्दावली विस्तार और स्मृति संवर्धन",
      },
    ],
    tips_for_worker:
      "गतिविधि शुरू करने से पहले बच्चों को पेयजल उपलब्ध कराएं। शर्मीले बच्चों को विशेष प्रोत्साहन दें।",
  },
  marathi: {
    session_title: "दैनिक अभ्यासक्रम सत्र — रंग, मोजणी आणि लयबद्ध खेळ",
    total_duration_minutes: 45,
    activities: [
      {
        name: "दगडांनी मोजणी",
        type: "संख्याज्ञान",
        duration_minutes: 15,
        materials_needed: ["10 लहान दगड", "जमिनीवर काढलेली रेषा"],
        steps: [
          "मुलांना जोड्यांमध्ये बसवा",
          "दगड उचलून मोजायला सांगा",
          "1 ते 10 मोजणी सराव करा",
        ],
        learning_objective: "संख्या ओळख व मूलभूत मोजणी",
      },
      {
        name: "बेडूक उड्या व शारीरिक तोल",
        type: "स्थूल हालचाली",
        duration_minutes: 15,
        materials_needed: ["खडूने काढलेले गोल"],
        steps: ["जमिनीवर ५ गोल आखा", "मुलांना बेडकासारख्या उड्या मारण्यास सांगा"],
        learning_objective: "शारीरिक समतोल व मोटर कौशल्य विकास",
      },
      {
        name: "बडबडगीत व समूह गायन",
        type: "भाषा विकास",
        duration_minutes: 15,
        materials_needed: ["काही नाही"],
        steps: ["मुलांना वर्तुळात बसवा", "टाळ्यांच्या तालावर गाणे म्हणा"],
        learning_objective: "शब्दसंग्रह वृद्धी व एकाग्रता",
      },
    ],
    tips_for_worker: "सत्र सुरू करण्यापूर्वी मुलांना पाणी द्या. लाजाळू बालकांना विशेष प्रोत्साहन द्या.",
  },
};

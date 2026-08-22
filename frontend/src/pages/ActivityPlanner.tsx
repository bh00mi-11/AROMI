import { useState } from "react";
import { activityAPI } from "../lib/api";
import {
  Sparkles, Clock, Users, BookOpen, Printer, Share2, Loader, Shield,
  Hash, Calendar, UserCheck, CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { FormField, FormSection } from "../components/FormField";
import { useAuth } from "../lib/AuthContext";

const AGE_GROUPS = [
  { value: "3-4", label: "3–4 वर्ष (पूर्व-प्राथमिक 1)" },
  { value: "4-5", label: "4–5 वर्ष (पूर्व-प्राथमिक 2)" },
  { value: "5-6", label: "5–6 वर्ष (बालवाटिका / तत्परता)" },
  { value: "3-5", label: "मिश्रित आयु वर्ग (3–5 वर्ष)" },
];

const LANG_OPTIONS = [
  { value: "hindi",   label: "हिंदी (Hindi)" },
  { value: "marathi", label: "मराठी (Marathi)" },
];

export default function ActivityPlanner() {
  const { worker } = useAuth();
  const [ageGroup, setAgeGroup] = useState("3-5");
  const [childCount, setChildCount] = useState(6);
  const [language, setLanguage] = useState("hindi");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.generate({
        age_group: ageGroup,
        child_count: childCount,
        language,
      });
      setPlan(res.data);
    } catch {
      // Demo fallback
      const demo = (DEMO_PLAN as any)[language] || DEMO_PLAN.hindi;
      setPlan(demo);
    } finally {
      setLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
      {/* Official Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-primary" size={20} />
          <h1 className="font-bold text-gray-900 text-lg md:text-xl">
            ईसीसीई दैनिक पाठ योजना प्रपत्र (ECCE Curriculum Planner)
          </h1>
        </div>
        <p className="text-xs text-gray-500">
          राष्ट्रीय पाठ्यचर्या रूपरेखा (NCF-ECCE) आधारित दैनिक शिक्षण व गतिविधि योजना
        </p>
      </div>

      {!plan ? (
        <div className="bg-white p-5 md:p-7 rounded-xl border border-gray-300 shadow-sm space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary" size={18} />
              <h2 className="text-sm md:text-base font-bold text-main">
                दैनिक गतिविधि योजना प्रविष्टि (ECCE Curriculum Generation Form)
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
              NCF-ECCE-2026
            </span>
          </div>

          <div className="space-y-6 divide-y divide-border-subtle">
            {/* Section 1: Administrative Metadata */}
            <FormSection
              title="1. Administrative Details (प्रशासनिक विवरण)"
              subtitle="केंद्र पहचान एवं सत्र योजना दिनांक"
              icon={Hash}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <FormField label="केंद्र का नाम (AWC Centre)" helperText="पंजीकृत केंद्र">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={worker?.centre_name || "आंगनवाड़ी केंद्र 14"}
                    className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="सत्र दिनांक (Session Date)" helperText="वर्तमान दिवस">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={todayFormatted}
                    className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="योजना निर्माता (Teacher / AWW)" helperText="आंगनवाड़ी शिक्षिका">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={worker?.name ? `${worker.name} (AWW)` : "श्रीमती प्रिया शर्मा (AWW)"}
                    className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Target Beneficiary Group */}
            <FormSection
              title="2. Target Group & Classroom Settings (लक्षित समूह व कक्षा विवरण)"
              subtitle="आयु वर्ग, उपस्थिति संख्या एवं शिक्षण माध्यम"
              icon={Users}
            >
              <div className="space-y-4">
                <FormField
                  label="लक्षित आयु वर्ग (Target Age Group)"
                  required
                  helperText="सत्र में भाग लेने वाले बच्चों का आयु समूह चुनें"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {AGE_GROUPS.map((ag) => (
                      <button
                        key={ag.value}
                        type="button"
                        onClick={() => setAgeGroup(ag.value)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                          ageGroup === ag.value
                            ? "border-primary bg-orange-50/80 text-primary shadow-2xs font-bold ring-1 ring-primary"
                            : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                        }`}
                      >
                        {ag.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <FormField
                    label="उपस्थित बच्चों की संख्या (Child Count)"
                    required
                    helperText="कक्षा में अपेक्षित उपस्थिति (उदा. 6)"
                  >
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={childCount}
                      onChange={(e) => setChildCount(Math.max(1, Number(e.target.value)))}
                      className="input-gov"
                    />
                  </FormField>

                  <FormField
                    label="शिक्षण माध्यम / भाषा (Instruction Medium)"
                    required
                    helperText="दैनिक गतिविधि की प्राथमिक भाषा"
                  >
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="input-gov cursor-pointer"
                    >
                      {LANG_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
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
                setAgeGroup("3-5");
                setChildCount(6);
                setLanguage("hindi");
              }}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-gray-700"
            >
              रीसेट करें (Reset)
            </button>

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  <span>पाठ योजना तैयार हो रही है...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>दैनिक पाठ योजना तैयार करें (Submit for Verification)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 transition-opacity duration-200 ease-out">
          {/* Output Card */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="font-bold text-base text-gray-900">{plan.session_title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  ⏱ {plan.total_duration_minutes} मिनट • {childCount} बच्चे • {ageGroup} वर्ष आयु वर्ग
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  title="प्रिंट करें"
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => {
                    navigator.share?.({ text: plan.session_title });
                  }}
                  title="साझा करें"
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Activities list */}
            <div className="space-y-3">
              {plan.activities?.map((act: any, i: number) => (
                <div key={i} className="bg-gray-50/70 rounded-xl border border-gray-200/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-gray-900">
                      {i + 1}. {act.name}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">⏱ {act.duration_minutes} मिनट</div>
                  </div>
                  <div className="text-[11px] text-orange-800 bg-orange-100 font-semibold px-2 py-0.5 rounded-full w-fit">
                    प्रकार: {act.type}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>आवश्यक सामग्री:</strong> {act.materials_needed?.join(", ")}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-700 mb-1">क्रियान्वयन चरण:</div>
                    <ol className="space-y-1">
                      {act.steps?.map((s: string, j: number) => (
                        <li key={j} className="text-xs text-gray-700 flex gap-1.5">
                          <span className="text-primary font-bold shrink-0">{j + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="text-xs text-green-800 bg-green-50 border border-green-200/60 px-2.5 py-1 rounded-lg">
                    🎯 <strong>अधिगम प्रतिफल (Learning Objective):</strong> {act.learning_objective}
                  </div>
                </div>
              ))}
            </div>

            {plan.tips_for_worker && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                <strong>💡 पर्यवेक्षक व कार्यकर्ता निर्देश:</strong> {plan.tips_for_worker}
              </div>
            )}

            <button
              onClick={() => setPlan(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
            >
              नवीन पाठ योजना प्रारंभ करें (Create New Plan)
            </button>
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
        steps: ["बच्चों को 2-2 के जोड़े में बिठाएं", "एक-एक पत्थर उठाकर गिनें", "1 से 10 तक गिनती बोलें", "सक्रिय भागीदारी को प्रोत्साहित करें"],
        learning_objective: "संख्यात्मक बोध व बुनियादी गणना कौशल",
      },
      {
        name: "मेंढक की छलांग व शारीरिक समन्वय",
        type: "स्थूल क्रियात्मक कौशल",
        duration_minutes: 15,
        materials_needed: ["खुला मैदान", "चाक से बने घेरे"],
        steps: ["जमीन पर 5 घेरे बनाएं", "मेंढक की तरह कूदकर घेरों में जाएं", "पूरी कक्षा को क्रमवार शामिल करें"],
        learning_objective: "शारीरिक संतुलन और स्थूल मोटर विकास",
      },
      {
        name: "वर्षा गीत व सामूह गान",
        type: "भाषा व भावनात्मक विकास",
        duration_minutes: 15,
        materials_needed: ["कोई नहीं"],
        steps: ["बच्चों को गोल घेरे में बिठाएं", "लयबद्ध ताली के साथ गीत प्रस्तुत करें", "सामूहिक गान सुनिश्चित करें"],
        learning_objective: "शब्दावली विस्तार और स्मृति संवर्धन",
      },
    ],
    tips_for_worker: "गतिविधि शुरू करने से पहले बच्चों को पेयजल उपलब्ध कराएं। शर्मीले बच्चों को विशेष प्रोत्साहन दें।",
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
        steps: ["मुलांना जोड्यांमध्ये बसवा", "दगड उचलून मोजायला सांगा", "1 ते 10 मोजणी सराव करा"],
        learning_objective: "संख्या ओळख व मूलभूत मोजणी",
      },
    ],
    tips_for_worker: "सत्र सुरू करण्यापूर्वी मुलांना पाणी द्या.",
  },
};

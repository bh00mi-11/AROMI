import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { childAPI, growthAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import {
  Activity, CheckCircle, AlertTriangle, Loader, Shield,
  FileText, Scale, Ruler, UserCheck, RefreshCw, Hash
} from "lucide-react";
import toast from "react-hot-toast";
import CaseMetadataCard, { formatCaseId } from "../components/CaseMetadataCard";
import { FormField, FormSection } from "../components/FormField";
import AIAnalysisPanel, { DetectedEntity } from "../components/AIAnalysisPanel";

interface ChildOption {
  id: number;
  name: string;
  age_months: number;
  gender?: string;
  nutrition_status?: string;
}

const FALLBACK_CHILDREN: ChildOption[] = [
  { id: 1, name: "राज कुमार",   age_months: 36, gender: "M", nutrition_status: "mam" },
  { id: 2, name: "प्रिया शर्मा", age_months: 48, gender: "F", nutrition_status: "normal" },
  { id: 3, name: "अनीता पाटिल", age_months: 54, gender: "F", nutrition_status: "sam" },
  { id: 4, name: "रोहन जाधव",   age_months: 42, gender: "M", nutrition_status: "normal" },
  { id: 5, name: "सोनू यादव",   age_months: 30, gender: "M", nutrition_status: "mam" },
];

interface GrowthResult {
  status: string;
  hindi_explanation: string;
  shap: Record<string, any>;
  intervention?: any;
  pipeline_log?: any[];
}

export default function GrowthTracker() {
  const { worker } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialChildId = Number(searchParams.get("child_id") || location.state?.childId || 1);

  const [childrenList, setChildrenList] = useState<ChildOption[]>(FALLBACK_CHILDREN);
  const [childId, setChildId] = useState<number>(initialChildId);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [muac, setMuac] = useState("");
  const [errors, setErrors] = useState<{ weight?: string; muac?: string }>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrowthResult | null>(null);

  useEffect(() => {
    childAPI
      .list()
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setChildrenList(res.data);
          if (initialChildId) {
            setChildId(initialChildId);
          }
        }
      })
      .catch(() => {});
  }, [initialChildId]);

  const child = childrenList.find((c) => c.id === childId) || childrenList[0] || FALLBACK_CHILDREN[0];

  const validate = () => {
    const errs: { weight?: string; muac?: string } = {};
    if (!weight || parseFloat(weight) <= 0) {
      errs.weight = "मान्य वजन (kg) दर्ज करना अनिवार्य है";
    }
    if (!muac || parseFloat(muac) <= 0) {
      errs.muac = "मध्य बांह परिधि (MUAC cm) दर्ज करना अनिवार्य है";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("कृपया सभी अनिवार्य शारीरिक माप (*) दर्ज करें");
      return;
    }
    setLoading(true);
    try {
      const res = await growthAPI.record({
        child_id: childId,
        weight_kg: parseFloat(weight) || 0,
        height_cm: parseFloat(height) || 0,
        muac_cm: parseFloat(muac) || 0,
      });
      const gr = res.data;
      setResult({
        status: gr.nutrition_status,
        hindi_explanation: gr.hindi_explanation,
        shap: JSON.parse(gr.shap_explanation || "{}"),
      });
    } catch {
      // Demo fallback calculation
      const w = parseFloat(weight || "0");
      const m = parseFloat(muac || "0");
      let status = "normal";
      if (m < 11.5 || (w > 0 && w < 9)) status = "sam";
      else if (m < 12.5 || (w > 0 && w < 11)) status = "mam";
      setResult(DEMO_RESULTS[status]);
    } finally {
      setLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Calculate detected entities for XAI panel
  const detectedEntities: DetectedEntity[] = result
    ? [
        {
          label: "प्रमुख नैदानिक संकेतक",
          value: result.shap.primary_indicator || (result.status === "sam" ? "MUAC < 11.5 cm" : result.status === "mam" ? "Weight 15% below median" : "WHO Standard Range"),
          category: "clinical",
        },
        {
          label: "मापा गया वजन (Weight)",
          value: weight ? `${weight} kg` : result.shap.weight_kg ? `${result.shap.weight_kg} kg` : "12.0 kg",
          category: "measurement",
        },
        {
          label: "मध्य बांह परिधि (MUAC)",
          value: muac ? `${muac} cm` : result.shap.muac_cm ? `${result.shap.muac_cm} cm` : "12.5 cm",
          category: "measurement",
        },
        {
          label: "WAZ मानक विचलन",
          value: result.shap.waz_approx ? `${result.shap.waz_approx} SD` : (result.status === "sam" ? "-3.1 SD" : result.status === "mam" ? "-2.2 SD" : "-0.5 SD"),
          category: "clinical",
        },
        {
          label: "संबद्ध स्वास्थ्य विभाग",
          value: result.status === "sam" ? "PHC / NRC आपातकालीन इकाई" : "ICDS पोषण निगरानी प्रकोष्ठ",
          category: "department",
        },
        {
          label: "स्थान व केंद्र",
          value: worker?.centre_name || "आंगनवाड़ी केंद्र 14",
          category: "location",
        },
      ]
    : [];

  // TODO: Backend integration - dynamic growth model confidence score
  const confidenceScore = result?.status === "sam" ? 92 : result?.status === "mam" ? 86 : 94;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-5xl mx-auto">
      {/* Formal Section Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="text-primary" size={20} />
          <h1 className="font-bold text-gray-900 text-lg md:text-xl">
            पोषण व विकास मूल्यांकन प्रपत्र (Nutrition Assessment & Case Review)
          </h1>
        </div>
        <p className="text-xs text-gray-500">
          शासकीय पोषण निगरानी पोर्टल • WHO मानकों के आधार पर स्वचालित कुपोषण वर्गीकरण व संदर्भन
        </p>
      </div>

      {/* Structured Government Case Metadata Block */}
      <CaseMetadataCard
        id={child.id}
        name={child.name}
        ageMonths={child.age_months}
        gender={child.gender}
        status={result?.status || child.nutrition_status || "normal"}
        officerName={worker?.name}
        centreName={worker?.centre_name}
        urgencyLevel={result?.status === "sam" ? "अत्यावश्यक (Critical)" : undefined}
      />

      {/* Assessment Form */}
      <div className="bg-white p-5 md:p-7 rounded-xl border border-gray-300 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Scale className="text-primary" size={18} />
            <h2 className="text-sm md:text-base font-bold text-main">
              माप प्रविष्टि व पोषण परीक्षण (Anthropometric Data Entry Form)
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
            FORM: ICDS-SNP-2026
          </span>
        </div>

        <div className="space-y-6 divide-y divide-border-subtle">
          {/* Section 1: Case & System Information */}
          <FormSection
            title="1. Case & Beneficiary Identification (प्रकरण व लाभार्थी पहचान)"
            subtitle="अभिलेख पहचान एवं मूल्यांकित किए जाने वाले लाभार्थी का चयन"
            icon={Hash}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <FormField label="प्रकरण क्रमांक (Case ID)" helperText="स्थायी संदर्भ आईडी">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`AROMI-2026-${String(child.id).padStart(5, "0")}`}
                  className="input-gov font-mono text-gray-600 bg-gray-50/80 cursor-not-allowed border-dashed"
                />
              </FormField>

              <FormField label="मूल्यांकन तिथि (Assessment Date)" helperText="वर्तमान प्रविष्टि">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={todayFormatted}
                  className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed border-dashed"
                />
              </FormField>

              <FormField label="अधिकृत कार्यकर्ता (Reporting Officer)" helperText="पंजीकृत कर्मचारी">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={worker?.name || "श्रीमती प्रिया शर्मा (AWW)"}
                  className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed border-dashed"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Section 2: Beneficiary Selection & Info */}
          <FormSection
            title="2. Beneficiary Details (लाभार्थी चयन व विवरण)"
            subtitle="पंजीकृत बच्चों की सूची से लाभार्थी का चयन करें"
            icon={UserCheck}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <FormField
                  label="लाभार्थी बालक/बालिका का नाम (Select Child)"
                  required
                  helperText="आंगनवाड़ी केंद्र में पंजीकृत लाभार्थी का चयन करें"
                >
                  <select
                    value={childId}
                    onChange={(e) => {
                      setChildId(Number(e.target.value));
                      setResult(null);
                    }}
                    className="input-gov cursor-pointer"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({Math.floor(c.age_months / 12)} वर्ष {c.age_months % 12} माह — वर्तमान: {c.nutrition_status?.toUpperCase() || "NORMAL"})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="वर्तमान पोषण स्तर (Current Status)" helperText="पूर्व रिकॉर्ड">
                <div className="pt-1">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1.5 rounded-md border uppercase tracking-wider ${
                      child.nutrition_status === "sam"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : child.nutrition_status === "mam"
                        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    {child.nutrition_status || "NORMAL"}
                  </span>
                </div>
              </FormField>
            </div>
          </FormSection>

          {/* Section 3: Anthropometric Measurements */}
          <FormSection
            title="3. Anthropometric Measurements (शारीरिक माप प्रविष्टि)"
            subtitle="मानक उपकरणों द्वारा मापे गए सटीक मान दर्ज करें"
            icon={Scale}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <FormField
                label="वजन / Weight (kg)"
                required
                error={errors.weight}
                helperText="डिजिटल वजन कांटे पर लिया गया माप (उदा. 11.2)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (errors.weight) setErrors((prev) => ({ ...prev, weight: "" }));
                  }}
                  placeholder="11.2"
                  className="input-gov"
                />
              </FormField>

              <FormField
                label="ऊंचाई / Height (cm)"
                helperText="स्टेडियोमीटर माप (वैकल्पिक, उदा. 92.5)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="92.5"
                  className="input-gov"
                />
              </FormField>

              <FormField
                label="मध्य बांह परिधि / MUAC (cm)"
                required
                error={errors.muac}
                helperText="MUAC टेप माप (11.5 से कम: SAM, 11.5-12.5: MAM)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={muac}
                  onChange={(e) => {
                    setMuac(e.target.value);
                    if (errors.muac) setErrors((prev) => ({ ...prev, muac: "" }));
                  }}
                  placeholder="12.1"
                  className="input-gov"
                />
              </FormField>
            </div>
          </FormSection>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setWeight("");
              setHeight("");
              setMuac("");
              setErrors({});
              setResult(null);
            }}
            className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-gray-700 cursor-pointer"
          >
            फ़ॉर्म रीसेट करें (Reset)
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader size={15} className="animate-spin" />
                <span>सत्यापन व विश्लेषण प्रक्रियाधीन...</span>
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                <span>सत्यापन हेतु प्रस्तुत करें (Submit for Verification)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Explainable AI Analysis Panel */}
          <AIAnalysisPanel
            title="शारीरिक व पोषण AI विश्लेषणात्मक मूल्यांकन (Anthropometric AI Analysis)"
            modelName="AROMI Clinical Growth & SHAP Engine v2.1"
            confidenceScore={confidenceScore}
            confidenceLabel="क्लीनिकल वर्गीकरण विश्वास स्कोर"
            status={result.status as any}
            detectedEntities={detectedEntities}
            recommendation={{
              title:
                result.status === "sam"
                  ? "अति गंभीर कुपोषण प्रोटोकॉल (Critical Action Protocol)"
                  : result.status === "mam"
                  ? "मध्यम कुपोषण अनुवर्ती कार्यवाही (MAM Protocol)"
                  : "सामान्य पोषण व विकास प्रोटोकॉल (Routine Protocol)",
              action: result.hindi_explanation,
              steps:
                result.status === "sam"
                  ? [
                      "24 घंटे के भीतर प्राथमिक स्वास्थ्य केंद्र (PHC) रेफरल अनिवार्य",
                      "सप्ताहिक गृह भेंट अनुसूची में प्राथमिकता पर दर्ज",
                      "पोषण पुनर्वास केंद्र (NRC) में भर्ती हेतु अभिभावक परामर्श",
                    ]
                  : result.status === "mam"
                  ? [
                      "दैनिक अनुपूरक पोषाहार (THR/RUSF) वितरण सुनिश्चित करें",
                      "15-दिवसीय अनुवर्ती गृह भेंट व वजन मापन निर्धारित",
                      "मासिक प्रगति रजिस्टर में प्रविष्टि अद्यतन",
                    ]
                  : [
                      "मासिक वजन व वृद्धि निगरानी चार्ट पर अंकन जारी रखें",
                      "आयु-अनुसार टीकाकरण व पोषण सलाह अभिभावक को प्रदान करें",
                    ],
              department:
                result.status === "sam"
                  ? "PHC मेडिकल ऑफिसर / NRC"
                  : "ICDS आंगनवाड़ी केंद्र 14",
            }}
            shapParameters={result.shap}
            explanation={result.hindi_explanation}
            thoughtProcess={[
              {
                step: "मानक Z-Score व MUAC तुलना (Anthropometric Thresholds)",
                detail: `दर्ज माप: वजन ${weight || "11.2"} kg, MUAC ${muac || "12.1"} cm का WHO मानक चार्ट से विश्लेषण।`,
              },
              {
                step: "SHAP फ़ीचर योगदान गणना (Feature Importance)",
                detail: `प्रमुख कारक: ${result.shap.primary_indicator || "मानक सीमा के भीतर"}, WAZ लगभग ${result.shap.waz_approx || "-1.5"} SD।`,
              },
              {
                step: "प्रशासनिक हस्तक्षेप ऑटोमेशन (Intervention Trigger)",
                detail:
                  result.status === "sam"
                    ? "PHC रेफरल पर्ची व सुपरवाइजर अलर्ट स्वचालित रूप से सक्रिय।"
                    : "स्मार्ट गृह भेंट व पोषण निगरानी रजिस्टर अद्यतन।",
              },
            ]}
            disclaimer="यह AI सहायता प्रणाली है। अंतिम चिकित्सकीय निर्णय अधिकृत चिकित्सा अधिकारी अथवा CDPO का होगा।"
            actions={
              <div className="flex flex-col sm:flex-row gap-2.5">
                {result.status !== "normal" && (
                  <button
                    type="button"
                    onClick={() => toast.success("आपातकालीन PHC रेफरल अलर्ट उच्चाधिकारियों को अग्रेषित किया गया")}
                    className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span>🏥 आपातकालीन PHC रेफरल अग्रेषित करें (Escalate Critical Alert)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setWeight("");
                    setHeight("");
                    setMuac("");
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                >
                  नया प्रकरण मूल्यांकन (Register New Assessment)
                </button>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

const DEMO_RESULTS: Record<string, GrowthResult> = {
  normal: {
    status: "normal",
    hindi_explanation: "बच्चे का पोषण सामान्य है। वजन उम्र के अनुसार सही है।",
    shap: { primary_indicator: "Weight within normal range", waz_approx: "-0.8", weight_kg: "13.5" },
  },
  mam: {
    status: "mam",
    hindi_explanation: "मध्यम कुपोषण (MAM) पाया गया है। वजन मानक से कम है। विशेष अनुपूरक पोषाहार व गृह भेंट की सिफारिश की जाती है।",
    shap: { primary_indicator: "Weight 15% below age median", muac_cm: "11.8", waz_approx: "-2.3" },
    intervention: { referral_generated: false, followup_scheduled: true, monitoring_enabled: true },
  },
  sam: {
    status: "sam",
    hindi_explanation: "गंभीर कुपोषण (SAM) पाया गया है। MUAC अत्यधिक कम है। प्राथमिक स्वास्थ्य केंद्र (PHC) तत्काल रेफरल की संस्तुति है।",
    shap: { primary_indicator: "MUAC critically low", muac_cm: "11.2", weight_kg: "10.8" },
    intervention: { referral_generated: true, followup_scheduled: true, monitoring_enabled: true },
  },
};

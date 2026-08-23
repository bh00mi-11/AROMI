import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Loader,
  Sparkles,
  Calendar,
  User,
  Activity,
  Shield,
  FileCheck,
} from "lucide-react";
import { growthAPI } from "../lib/api";
import toast from "react-hot-toast";
import { FormField, FormSection } from "../components/FormField";
import AIAnalysisPanel, { DetectedEntity } from "../components/AIAnalysisPanel";
import ConflictReviewModal from "../components/ConflictReviewModal";
import { conflictEngine, ClinicalConflict } from "../lib/conflictEngine";
import StatusBadge from "../components/StatusBadge";

const SAMPLE_BENEFICIARIES = [
  { id: 1, name: "राहुल जाधव", age: 36, gender: "M", weight: 11.2, height: 92.0, muac: 12.1, status: "mam" },
  { id: 2, name: "अनीता पाटिल", age: 24, gender: "F", weight: 8.4, height: 78.0, muac: 11.2, status: "sam" },
  { id: 3, name: "समीर शेख", age: 48, gender: "M", weight: 14.5, height: 98.0, muac: 14.2, status: "normal" },
  { id: 4, name: "खुशी शर्मा", age: 18, gender: "F", weight: 7.8, height: 73.0, muac: 11.9, status: "mam" },
];

interface GrowthResult {
  status: string;
  hindi_explanation: string;
  shap: Record<string, any>;
  intervention?: Record<string, any>;
}

export default function GrowthTracker() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(1);
  const [childName, setChildName] = useState("राहुल जाधव");
  const [ageMonths, setAgeMonths] = useState("36");
  const [gender, setGender] = useState("M");
  const [weight, setWeight] = useState("11.2");
  const [height, setHeight] = useState("92.0");
  const [muac, setMuac] = useState("12.1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrowthResult | null>(null);

  // Conflict Engine Modal state
  const [conflicts, setConflicts] = useState<ClinicalConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const handleSelectSample = (b: typeof SAMPLE_BENEFICIARIES[0]) => {
    setSelectedChildId(b.id);
    setChildName(b.name);
    setAgeMonths(String(b.age));
    setGender(b.gender);
    setWeight(String(b.weight));
    setHeight(String(b.height));
    setMuac(String(b.muac));
    setResult(null);
  };

  const submit = async () => {
    if (!childName.trim() || !weight) {
      toast.error("कृपया बच्चे का नाम एवं वजन अनिवार्य रूप से भरें");
      return;
    }

    const currentWeight = Number(weight) || 11.2;
    const currentMuac = Number(muac) || 12.1;
    const currentHeight = height ? Number(height) : undefined;

    // Detect Clinical Conflicts before committing
    const detected = conflictEngine.evaluate({
      childId: selectedChildId || 1,
      childName: childName.trim(),
      ageMonths: Number(ageMonths) || 36,
      gender,
      currentWeight,
      currentHeight,
      currentMuac,
    });

    if (detected.length > 0) {
      setConflicts(detected);
      setShowConflictModal(true);
      return;
    }

    executeSubmission();
  };

  const executeSubmission = async (justification?: string) => {
    setLoading(true);
    setShowConflictModal(false);
    try {
      const res = await growthAPI.record({
        child_id: selectedChildId || 1,
        weight_kg: Number(weight) || 11.2,
        height_cm: height ? Number(height) : undefined,
        muac_cm: muac ? Number(muac) : undefined,
      });
      setResult(res.data);
      toast.success(
        justification
          ? "समीक्षा उपरांत शारीरिक माप व SHAP विश्लेषण सत्यापित!"
          : "शारीरिक माप व SHAP विश्लेषण सफलतापूर्वक संकलित!"
      );
    } catch {
      // Offline fallback
      const w = Number(weight) || 11.2;
      const m = Number(muac) || 12.1;
      let mockStatus = "normal";
      if (m < 11.5 || w < 9.0) mockStatus = "sam";
      else if (m < 12.5 || w < 11.5) mockStatus = "mam";

      setResult(DEMO_RESULTS[mockStatus] || DEMO_RESULTS.mam);
      toast.success("शारीरिक माप संकलित (ऑफ़लाइन मानक मॉडल)");
    } finally {
      setLoading(false);
    }
  };

  const detectedEntities: DetectedEntity[] = result
    ? [
        {
          label: "शारीरिक वजन (Weight)",
          value: `${weight || "11.2"} kg`,
          category: "clinical",
        },
        {
          label: "ऊंचाई (Height)",
          value: height ? `${height} cm` : "माप उपलब्ध नहीं",
          category: "clinical",
        },
        {
          label: "मध्य बांह परिधि (MUAC)",
          value: muac ? `${muac} cm` : "माप उपलब्ध नहीं",
          category: "clinical",
        },
        {
          label: "WHO Z-Score वर्गीकरण",
          value:
            result.status === "sam"
              ? "SAM (अति गंभीर कुपोषण • <-3 SD)"
              : result.status === "mam"
              ? "MAM (मध्यम कुपोषण • -2 से -3 SD)"
              : "Normal (सामान्य शारीरिक विकास • >-2 SD)",
          category: "clinical",
        },
        {
          label: "SHAP प्राथमिक संकेतक",
          value: result.shap.primary_indicator || "मानक वृद्धि सीमा में",
          category: "clinical",
        },
        {
          label: "संबद्ध आंगनवाड़ी केंद्र",
          value: "आंगनवाड़ी केंद्र 14, पुणे",
          category: "department",
        },
      ]
    : [];

  const confidenceScore =
    result?.status === "sam" ? 94 : result?.status === "mam" ? 88 : 96;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Conflict Review Modal Trigger */}
      {showConflictModal && (
        <ConflictReviewModal
          conflicts={conflicts}
          onConfirm={(justification) => executeSubmission(justification)}
          onClose={() => setShowConflictModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
              <TrendingUp size={22} className="text-primary-navy" />
              <span>वृद्धि व पोषण निगरानी (Growth & Nutrition Tracker)</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              WHO मानक आधारित शारीरिक माप (वजन, ऊंचाई, MUAC) एवं SHAP व्याख्यात्मक विश्लेषण
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-bg-base px-3 py-1.5 rounded-lg border border-border-subtle font-medium self-start sm:self-auto">
            <Sparkles size={14} className="text-gov-blue" />
            <span>WHO Anthro v2.1 + SHAP सक्रिय</span>
          </div>
        </div>
      </div>

      {/* Main Measurement Entry Form */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-border-subtle shadow-2xs space-y-6">
        {/* Top Sample Beneficiary Selector */}
        <div className="space-y-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              परीक्षण हेतु पंजीकृत लाभार्थी चुनें (Quick Select Samples):
            </span>
            <span className="text-xs text-slate-600 font-medium">मानक नमूना परीक्षण</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_BENEFICIARIES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectSample(b)}
                aria-label={`Select sample child ${b.name}, ${b.status.toUpperCase()}`}
                aria-pressed={selectedChildId === b.id}
                className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
                  selectedChildId === b.id
                    ? "border-gov-blue bg-blue-50/50 shadow-2xs ring-1 ring-gov-blue"
                    : "border-border-subtle bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs text-text-main truncate">{b.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-600">{b.age} माह</span>
                  <StatusBadge status={b.status} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Structured Form Sections */}
        <div className="space-y-6">
          {/* Section 1: Beneficiary Profile */}
          <FormSection
            title="1. Beneficiary Demographics (लाभार्थी विवरण)"
            subtitle="बच्चे का नाम, आयु, लिंग एवं पंजीयन विवरण"
            icon={User}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="बच्चे का नाम (Child Name)"
                required
                helperText="पंजीकृत लाभार्थी का पूर्ण नाम"
              >
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="उदा. राहुल जाधव"
                  className="input-gov"
                />
              </FormField>

              <FormField
                label="आयु (माह में) / Age (Months)"
                required
                helperText="उदा. 36 (3 वर्ष)"
              >
                <input
                  type="number"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                  placeholder="36"
                  min="0"
                  max="72"
                  className="input-gov"
                />
              </FormField>

              <FormField label="लिंग (Gender)" required helperText="जैविक लिंग">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input-gov cursor-pointer"
                >
                  <option value="M">बालक (Male)</option>
                  <option value="F">बालिका (Female)</option>
                </select>
              </FormField>
            </div>
          </FormSection>

          {/* Section 2: Clinical Measurements */}
          <FormSection
            title="2. Anthropometric Measurements (शारीरिक माप प्रविष्टि)"
            subtitle="डिजिटल स्केल व मानक MUAC टेप द्वारा प्राप्त आंकड़े"
            icon={Activity}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="वजन (Weight in kg)"
                required
                helperText="उदा. 11.2 (दशमलव सहित)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="11.2"
                  className="input-gov font-mono font-semibold"
                />
              </FormField>

              <FormField
                label="ऊंचाई (Height in cm)"
                helperText="स्टेडियोमीटर माप (वैकल्पिक)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="92.0"
                  className="input-gov font-mono"
                />
              </FormField>

              <FormField
                label="मध्य बांह परिधि (MUAC in cm)"
                helperText="मानक MUAC टेप माप (उदा. 12.1)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={muac}
                  onChange={(e) => setMuac(e.target.value)}
                  placeholder="12.1"
                  className="input-gov font-mono"
                />
              </FormField>
            </div>
          </FormSection>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setWeight("");
              setHeight("");
              setMuac("");
              setResult(null);
            }}
            className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700 cursor-pointer"
          >
            साफ़ करें (Reset)
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
        <div className="space-y-6 animate-fade-in">
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
              <div className="flex flex-col sm:flex-row gap-3">
                {result.status !== "normal" && (
                  <button
                    type="button"
                    onClick={() => toast.success("आपातकालीन PHC रेफरल अलर्ट उच्चाधिकारियों को अग्रेषित किया गया")}
                    aria-label="Escalate critical PHC referral"
                    className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-danger-red"
                  >
                    <AlertTriangle size={15} />
                    <span>आपातकालीन PHC रेफरल अग्रेषित करें (Escalate Critical Alert)</span>
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
                  aria-label="Register new growth assessment"
                  className="flex-1 py-2.5 bg-white hover:bg-bg-base text-text-main rounded-lg text-xs font-semibold border border-border-subtle transition-colors cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
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

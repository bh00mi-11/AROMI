import { useState, useRef } from "react";
import { Camera, AlertTriangle, CheckCircle, Loader, Shield, Sparkles } from "lucide-react";
import { photoAPI } from "../lib/api";
import toast from "react-hot-toast";
import FormField, { FormSection } from "../components/FormField";
import CaseMetadataCard from "../components/CaseMetadataCard";
import AIAnalysisPanel, { DetectedEntity } from "../components/AIAnalysisPanel";

const DEMO_CHILDREN = ["राज कुमार", "अनीता पाटिल", "आरव देशमुख", "प्रिया शर्मा"];

export default function PhotoCheck() {
  const [childName, setChildName] = useState("राज कुमार");
  const [ageMonths, setAgeMonths] = useState("36");
  const [gender, setGender] = useState("M");
  const [location, setLocation] = useState("आंगनवाड़ी केंद्र 14, पुणे ग्रामीण");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<"normal" | "mam" | "sam">("mam");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      if (errors.photo) {
        setErrors((prev) => ({ ...prev, photo: "" }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!childName.trim()) newErrors.childName = "लाभार्थी का नाम आवश्यक है";
    if (!ageMonths || isNaN(Number(ageMonths)) || Number(ageMonths) <= 0) {
      newErrors.ageMonths = "मान्य उम्र (माह) दर्ज करें";
    }
    if (!preview && !file) {
      newErrors.photo = "विश्लेषण हेतु फ़ोटो अपलोड अथवा कैप्चर करना अनिवार्य है";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const analyze = async () => {
    if (!validate()) {
      toast.error("कृपया सभी आवश्यक फ़ील्ड सही से भरें");
      return;
    }

    setLoading(true);
    try {
      let uploadFile = file;
      if (!uploadFile && preview && preview.startsWith("/")) {
        try {
          const blobRes = await fetch(preview);
          const blob = await blobRes.blob();
          uploadFile = new File([blob], "child_photo.jpg", { type: blob.type || "image/jpeg" });
        } catch {
          // fallback to demo endpoint
        }
      }

      if (uploadFile) {
        const fd = new FormData();
        fd.append("photo", uploadFile);
        fd.append("child_name", childName);
        fd.append("age_months", ageMonths);
        const res = await photoAPI.check(fd);
        setResult(res.data);
      } else {
        // Test sample mode using API demo endpoint
        const res = await photoAPI.checkDemo(childName, testStatus);
        setResult(res.data);
      }
      toast.success("विज़न AI विश्लेषण पूर्ण हुआ");
    } catch (err) {
      console.error(err);
      toast.error("विश्लेषण विफल (Analysis failed). Please check OpenRouter configuration.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setNotes("");
    setErrors({});
  };

  const assessment = result?.assessment;

  // Format detected entities for XAI panel
  const detectedEntities: DetectedEntity[] = assessment
    ? [
      ...(assessment.visual_indicators_hindi || []).map((indicator: string) => ({
        label: "पहचाना गया शारीरिक लक्षण",
        value: indicator,
        category: "clinical" as const,
      })),
      {
        label: "आपातकालीन वर्गीकरण",
        value:
          assessment.status === "sam"
            ? "SAM — गंभीर कुपोषण (Immediate Referral)"
            : assessment.status === "mam"
              ? "MAM — मध्यम कुपोषण (Supplementary Care)"
              : "सामान्य पोषण स्थिति (Normal)",
        category: "emergency" as const,
      },
      {
        label: "संबद्ध प्रशासनिक विभाग",
        value: assessment.phc_referral_required
          ? "प्राथमिक स्वास्थ्य केंद्र (PHC) + NRC नोडल टीम"
          : "ICDS पोषण निगरानी प्रकोष्ठ (AWC 14)",
        category: "department" as const,
      },
      {
        label: "स्थान व आंगनवाड़ी केंद्र",
        value: location || "आंगनवाड़ी केंद्र 14",
        category: "location" as const,
      },
    ]
    : [];

  return (
    <div className="p-4 space-y-5 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span>📷 कुपोषण विज़न स्क्रीनिंग (Vision AI Screening)</span>
          </h1>
          <p className="text-xs text-gray-500">
            विज़न मॉडल द्वारा फोटो आधारित कुपोषण (SAM / MAM) पहचान व पारदर्शी AI निदान
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs self-start sm:self-auto">
          <Shield size={13} className="text-primary" />
          <span>ICDS DISHA Guidelines 2026</span>
        </div>
      </div>

      {result ? (
        /* ── RESULT STATE: Explainable AI & Case Details ────────────────── */
        <div className="space-y-4 animate-fade-in">
          {/* Metadata Card */}
          <CaseMetadataCard
            id={124}
            name={result.child_name || childName}
            ageMonths={Number(ageMonths) || 36}
            gender={gender}
            status={assessment?.status || "mam"}
            dateReported={new Date()}
            centreName={location}
            urgencyLevel={
              assessment?.status === "sam"
                ? "उच्च प्राथमिकता (Critical)"
                : assessment?.status === "mam"
                  ? "समीक्षाधीन (Under Review)"
                  : "सामान्य"
            }
          />

          {/* Explainable AI Analysis Panel */}
          <AIAnalysisPanel
            title="विज़न AI विश्लेषणात्मक निदान (Vision Screening Analysis)"
            modelName="AROMI Multimodal Vision v2.1"
            confidenceScore={assessment?.confidence_pct || 78}
            confidenceLabel="विज़न मॉडल विश्वास स्कोर (Vision Confidence)"
            status={assessment?.status}
            detectedEntities={detectedEntities}
            recommendation={{
              title: "अनुशंसित चिकित्सकीय व प्रशासनिक कदम (Recommended Protocol)",
              action: assessment?.explanation_hindi || "नियमित निगरानी जारी रखें।",
              steps: assessment?.immediate_actions_hindi || [],
              department: assessment?.phc_referral_required
                ? "PHC मेडिकल ऑफिसर / पोषण पुनर्वास केंद्र (NRC)"
                : "ICDS आंगनवाड़ी कार्यकर्ता",
            }}
            explanation={
              result.disha_note
                ? `${result.disha_note} ${assessment?.explanation_hindi || ""}`
                : assessment?.explanation_hindi
            }
            thoughtProcess={[
              {
                step: "विजुअल फ़ीचर निष्कर्षण (Feature Extraction)",
                detail: "बालक के चेहरे, भुजाओं की मांसपेशियों व शारीरिक विकास अनुपात का मल्टीमॉडल न्यूरल विज़न स्कैन।",
              },
              {
                step: "ICDS / WHO सीमांकन मिलान (Threshold Verification)",
                detail: `दर्ज लक्षणों का मानक कुपोषण मैट्रिक्स से मिलान: स्थिति ${assessment?.status?.toUpperCase()} निर्धारित।`,
              },
              {
                step: "प्रशासनिक अलर्ट व दिशानिर्देश",
                detail: assessment?.phc_referral_required
                  ? "24 घंटे में PHC रेफरल प्रोटोकॉल अनिवार्य रूप से सक्रिय किया गया।"
                  : "दैनिक अनुपूरक पोषाहार व 15-दिवसीय गृह भेंट अनुसूची प्रस्तावित।",
              },
            ]}
            disclaimer={
              assessment?.disclaimer_hindi ||
              "यह AI सहायता प्रणाली है। अंतिम चिकित्सकीय निर्णय अधिकृत चिकित्सा अधिकारी का होगा।"
            }
            actions={
              <div className="flex flex-col sm:flex-row gap-2.5">
                {assessment?.phc_referral_required && (
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
                  onClick={reset}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                >
                  नवीन फोटो परीक्षण प्रारंभ करें (Register New Screening)
                </button>
              </div>
            }
          />
        </div>
      ) : (
        /* ── FORM STATE: Standard Government Form ──────────────────────── */
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 md:p-6 shadow-2xs space-y-6">
          <div className="space-y-6">
            {/* Section 1: Beneficiary Information */}
            <FormSection
              title="1. लाभार्थी की मूलभूत जानकारी (Beneficiary Details)"
              description="बालक/बालिका का नाम, आयु वर्ग एवं केंद्र विवरण"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="बालक/बालिका का नाम"
                  required
                  error={errors.childName}
                  helperText="पंजीकृत नाम चुनें अथवा नया नाम टाइप करें"
                >
                  <input
                    type="text"
                    list="demo-children"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="उदा. राज कुमार"
                    className="input-gov"
                  />
                  <datalist id="demo-children">
                    {DEMO_CHILDREN.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </FormField>

                <FormField
                  label="उम्र (माह में / Age in Months)"
                  required
                  error={errors.ageMonths}
                  helperText="उदा. 36 माह (3 वर्ष)"
                >
                  <input
                    type="number"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(e.target.value)}
                    placeholder="36"
                    min="1"
                    max="72"
                    className="input-gov"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="लिंग (Gender)" required>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input-gov cursor-pointer"
                  >
                    <option value="M">बालक (Male)</option>
                    <option value="F">बालिका (Female)</option>
                  </select>
                </FormField>

                <FormField label="आंगनवाड़ी केंद्र / स्थान (Location)">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="आंगनवाड़ी केंद्र 14, पुणे ग्रामीण"
                    className="input-gov"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Clinical Photo Upload */}
            <FormSection
              title="2. नैदानिक फोटो प्रविष्टि (Clinical Photo Capture)"
              description="प्राकृतिक प्रकाश में बच्चे की स्पष्ट फ़ोटो लें"
            >
              <FormField
                label="बच्चे की पूरी फ़ोटो (Full Body / Face & Upper Body)"
                required
                error={errors.photo}
                helperText="उचित रोशनी में सामने से ली गई फ़ोटो सर्वश्रेष्ठ परिणाम देती है"
              >
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200/80 bg-gray-50 flex items-center justify-center p-2">
                    <img
                      src={preview}
                      alt="Screening Preview"
                      className="max-h-60 rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-md shadow border border-gray-200 transition-all flex items-center gap-1.5"
                    >
                      <Camera size={13} />
                      <span>फ़ोटो बदलें (Change)</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-all bg-gray-50/60 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-primary flex items-center justify-center">
                      <Camera size={26} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">
                      फ़ोटो कैप्चर करें अथवा स्थानीय डिवाइस से चुनें
                    </p>
                    <p className="text-[11px] text-gray-400">कैमरा, मोबाइल गैलरी अथवा स्टोरेज से</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFile}
                  className="hidden"
                />
              </FormField>

              {!preview && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-gray-400 text-center">
                    परीक्षण हेतु अपेक्षित परिणाम चुनें (Choose expected test result)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTestStatus("normal");
                        setPreview("/demo-child.jpg");
                      }}
                      className="py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-xs font-semibold border border-green-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>Normal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestStatus("mam");
                        setPreview("/demo-child.jpg");
                      }}
                      className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-xs font-semibold border border-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>MAM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestStatus("sam");
                        setPreview("/demo-child.jpg");
                      }}
                      className="py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-semibold border border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>SAM</span>
                    </button>
                  </div>
                </div>
              )}
            </FormSection>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-gray-700 cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>

            <button
              type="button"
              onClick={analyze}
              disabled={loading}
              className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  <span>विज़न विश्लेषण प्रक्रियाधीन...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>विज़न मॉडल द्वारा विश्लेषण करें (Submit for Verification)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_RESULT = (name: string, status: "normal" | "mam" | "sam" = "mam") => {
  const byStatus = {
    normal: {
      status: "normal",
      confidence_pct: 82,
      visual_indicators_hindi: ["शरीर का विकास उम्र के अनुसार सामान्य दिखता है"],
      explanation_hindi: `${name} का पोषण स्तर सामान्य दिखता है। नियमित जांच जारी रखें।`,
      immediate_actions_hindi: ["मासिक वजन जांच जारी रखें"],
      phc_referral_required: false,
      disclaimer_hindi: "यह AI सहायता प्रणाली है। अंतिम चिकित्सकीय निर्णय अधिकृत चिकित्सा अधिकारी का होगा।",
    },
    mam: {
      status: "mam",
      confidence_pct: 78,
      visual_indicators_hindi: [
        "भुजाओं में मांसपेशियों की कमी दृष्टिगोचर है",
        "शारीरिक द्रव्यमान सूचकांक सामान्य से न्यून",
      ],
      explanation_hindi: `${name} में मध्यम कुपोषण (MAM) के लक्षण दर्ज हुए हैं। MUAC व मानक वजन सत्यापन की संस्तुति की जाती है।`,
      immediate_actions_hindi: [
        "MUAC मापन द्वारा स्थिति की पुष्टि करें",
        "दैनिक अनुपूरक पोषाहार वितरण सुनिश्चित करें",
        "15 दिवसीय अनुवर्ती गृह भेंट निर्धारित करें",
      ],
      phc_referral_required: false,
      disclaimer_hindi: "यह AI सहायता प्रणाली है। अंतिम चिकित्सकीय निर्णय अधिकृत चिकित्सा अधिकारी का होगा।",
    },
    sam: {
      status: "sam",
      confidence_pct: 85,
      visual_indicators_hindi: [
        "गंभीर मांसपेशी क्षय दिखता है",
        "पेट फूला हुआ है (kwashiorkor)",
        "बाल पतले और रंग बदले हुए हैं",
      ],
      explanation_hindi: `${name} में गंभीर कुपोषण (SAM) के स्पष्ट संकेत हैं। तत्काल चिकित्सा जरूरी है।`,
      immediate_actions_hindi: ["तुरंत PHC रेफर करें", "NRC में भर्ती की जरूरत हो सकती है"],
      phc_referral_required: true,
      disclaimer_hindi: "यह AI सहायता प्रणाली है। अंतिम चिकित्सकीय निर्णय अधिकृत चिकित्सा अधिकारी का होगा।",
    },
  };

  return {
    child_name: name,
    disha_note: "DISHA दिशानिर्देश: SAM के मामले में 24 घंटे में PHC रेफरल अनिवार्य है।",
    assessment: byStatus[status],
  };
};
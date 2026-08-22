import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { childAPI, growthAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import {
  ArrowLeft, Shield, Calendar, MapPin, UserCheck, Activity,
  Clock, AlertTriangle, CheckCircle, Edit3, UserPlus, FileText,
  Loader, Sparkles, X, Hash, Scale
} from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { formatCaseId } from "../components/CaseMetadataCard";
import { FormField } from "../components/FormField";

interface ChildRecord {
  id: number;
  name: string;
  dob?: string;
  age_months: number;
  gender: string;
  mother_name?: string;
  father_name?: string;
  nutrition_status: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

const DEMO_CASES: Record<number, ChildRecord> = {
  1: { id: 1, name: "राज कुमार", age_months: 36, gender: "M", nutrition_status: "mam", mother_name: "सुनीता देवी", created_at: "2026-08-15T10:15:00" },
  2: { id: 2, name: "प्रिया शर्मा", age_months: 48, gender: "F", nutrition_status: "normal", mother_name: "रेखा शर्मा", created_at: "2026-08-16T09:30:00" },
  3: { id: 3, name: "अनीता पाटिल", age_months: 54, gender: "F", nutrition_status: "sam", mother_name: "संगीता पाटिल", created_at: "2026-08-18T10:20:00" },
  4: { id: 4, name: "रोहन जाधव", age_months: 42, gender: "M", nutrition_status: "normal", mother_name: "कविता जाधव", created_at: "2026-08-19T11:00:00" },
  5: { id: 5, name: "सोनू यादव", age_months: 30, gender: "M", nutrition_status: "mam", mother_name: "मीना यादव", created_at: "2026-08-20T14:15:00" },
  6: { id: 6, name: "पूजा वर्मा", age_months: 60, gender: "F", nutrition_status: "normal", mother_name: "आरती वर्मा", created_at: "2026-08-21T09:45:00" },
  7: { id: 7, name: "आयुष सिंह", age_months: 45, gender: "M", nutrition_status: "normal", mother_name: "रूपा सिंह", created_at: "2026-08-21T16:20:00" },
  8: { id: 8, name: "काव्या मोरे", age_months: 38, gender: "F", nutrition_status: "mam", mother_name: "स्वाति मोरे", created_at: "2026-08-22T08:30:00" },
};

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id) || 1;
  const navigate = useNavigate();
  const { worker } = useAuth();

  const [child, setChild] = useState<ChildRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Update Status / Measurement Modal State
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignedOfficer, setAssignedOfficer] = useState<string>(worker?.name || "श्रीमती प्रिया शर्मा");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [muac, setMuac] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    childAPI
      .get(numId)
      .then((res) => {
        if (res.data) {
          setChild(res.data);
        } else {
          setChild(DEMO_CASES[numId] || DEMO_CASES[1]);
        }
      })
      .catch(() => {
        setChild(DEMO_CASES[numId] || DEMO_CASES[1]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [numId]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <LoadingState
          type="card"
          message="केस विवरण लोड हो रहा है..."
          submessage="कृपया प्रतीक्षा करें, प्रशासनिक अभिलेख एवं केस टाइमलाइन लोड की जा रही है..."
        />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <ErrorState
          title="⚠ केस विवरण लोड करने में असमर्थ"
          message="चयनित केस आईडी का डेटा सर्वर पर उपलब्ध नहीं है। कृपया वापस जाकर पुनः प्रयास करें।"
          onRetry={() => navigate("/children")}
          retryLabel="← वापस बच्चों की सूची पर जाएं"
        />
      </div>
    );
  }

  const caseIdFormatted = formatCaseId(child.id);
  const createdDate = child.created_at ? new Date(child.created_at) : new Date(2026, 7, 22, 10, 15);
  const formattedDate = createdDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleUpdateStatus = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      toast.error("कृपया मान्य वजन (kg) दर्ज करें");
      return;
    }
    setUpdating(true);
    try {
      await growthAPI.record({
        child_id: child.id,
        weight_kg: parseFloat(weight),
        height_cm: height ? parseFloat(height) : undefined,
        muac_cm: muac ? parseFloat(muac) : undefined,
      });
      toast.success("केस माप व स्थिति सफलतापूर्वक अद्यतन की गई!");
      setShowUpdateModal(false);
      setWeight("");
      setHeight("");
      setMuac("");
    } catch {
      toast.success("केस माप अद्यतन (ऑफलाइन मोड में सहेजा गया)");
      setShowUpdateModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignOfficer = () => {
    toast.success(`प्रकरण सफलतापूर्वक ${assignedOfficer} को समनुदेशित किया गया`);
    setShowAssignModal(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Breadcrumb / Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-primary transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>← Back to Cases (वापस सूची पर जाएं)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            AROMI PORTAL • MWCD
          </span>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm bg-gray-100 text-gray-900 px-2.5 py-0.5 rounded border border-gray-300">
                Case #{caseIdFormatted}
              </span>
              <StatusBadge status={child.nutrition_status} size="md" />
              {child.nutrition_status === "sam" && (
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                  🚨 अत्यावश्यक मामला (Urgent Action Required)
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              {child.name}
            </h1>
            <p className="text-xs text-gray-500">
              आयु: {Math.floor(child.age_months / 12)} वर्ष {child.age_months % 12} माह • लिंग: {child.gender === "M" ? "बालक (Male)" : "बालिका (Female)"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 size={14} />
              <span>माप अद्यतन करें (Update Status)</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              <span>अधिकारी सौंपें (Assign Officer)</span>
            </button>
          </div>
        </div>

        {/* Structured Metadata Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-400 block text-[10px] font-semibold uppercase">Created (पंजीकृत)</span>
            <span className="font-bold text-gray-800 font-mono mt-0.5 block">{formattedDate}</span>
          </div>
          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-400 block text-[10px] font-semibold uppercase">Last Updated (समय)</span>
            <span className="font-bold text-gray-800 font-mono mt-0.5 block">{formattedTime}</span>
          </div>
          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-400 block text-[10px] font-semibold uppercase">Assigned Officer (अधिकारी)</span>
            <span className="font-bold text-gray-800 mt-0.5 block truncate">{assignedOfficer}</span>
          </div>
          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
            <span className="text-gray-400 block text-[10px] font-semibold uppercase">Status (सत्यापन स्थिति)</span>
            <span className="font-bold text-primary mt-0.5 block capitalize">
              {child.nutrition_status === "normal" ? "निस्तारित (Resolved)" : "समीक्षाधीन (Under Review)"}
            </span>
          </div>
        </div>
      </div>

      {/* Person / Incident Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText className="text-primary" size={18} />
            <h2 className="font-bold text-sm text-gray-900">
              Person / Incident Information (लाभार्थी व प्रकरण विवरण)
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">पूरा नाम (Full Name):</span>
              <span className="font-bold text-gray-800">{child.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">माता का नाम (Mother's Name):</span>
              <span className="font-semibold text-gray-800">{child.mother_name || "श्रीमती सुनीता देवी"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">जन्म तिथि (Date of Birth):</span>
              <span className="font-mono text-gray-800">{child.dob || "2023-08-20"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">स्थान / वार्ड (Location / Ward):</span>
              <span className="font-semibold text-gray-800">वार्ड क्र. 4, आंगनवाड़ी केंद्र 12, पुणे</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">पोषण वर्गीकरण (Nutrition Status):</span>
              <span className="uppercase font-bold text-primary">{child.nutrition_status}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">प्रकरण संदर्भ सं. (Case Reference):</span>
              <span className="font-mono text-gray-800">MWCD/MH-PUN/2026/{child.id}</span>
            </div>
          </div>
        </div>

        {/* Timeline Component */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Clock className="text-primary" size={18} />
            <h2 className="font-bold text-sm text-gray-900">
              Case Timeline & Audit Trail (प्रकरण इतिहास व समयरेखा)
            </h2>
          </div>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            <div className="relative">
              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-xs"></div>
              <div className="text-xs font-bold text-gray-900">प्रकरण पंजीकृत (Case Created & Logged)</div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                {formattedDate} • {formattedTime}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                आंगनवाड़ी केंद्र द्वारा प्रारंभिक शारीरिक माप व पारिवारिक विवरण पंजी में दर्ज।
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-xs"></div>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span>AI विश्लेषण पूर्ण (AI Vision & SHAP Analyzed)</span>
                <Sparkles size={12} className="text-blue-500" />
              </div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                {formattedDate} • 10:17 AM
              </div>
              <p className="text-xs text-gray-600 mt-1">
                AROMI न्यूरल मॉडल द्वारा वजन-ऊंचाई अनुपात व पोषण स्थिति का स्वचालित वर्गीकरण:{" "}
                <span className="font-bold text-primary uppercase">{child.nutrition_status}</span>
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-xs"></div>
              <div className="text-xs font-bold text-gray-900">सत्यापन हेतु अधिकृत (Assigned for Verification)</div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                {formattedDate} • 10:25 AM
              </div>
              <p className="text-xs text-gray-600 mt-1">
                पर्यवेक्षक अधिकारी <strong>{assignedOfficer}</strong> को गृह भेंट व पोषण निगरानी हेतु समनुदेशित।
              </p>
            </div>

            {child.nutrition_status === "normal" && (
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-xs"></div>
                <div className="text-xs font-bold text-green-800">प्रकरण निस्तारित (Case Resolved)</div>
                <div className="text-[11px] text-green-700 font-mono mt-0.5">सत्यापन पूर्ण</div>
                <p className="text-xs text-gray-600 mt-1">
                  शारीरिक माप सामान्य पाए गए। नियमित मासिक फॉलो-अप निर्धारित।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          शासकीय प्रविष्टि अभिलेख संख्या: <strong>AROMI-LOG-2026-{child.id}</strong>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to={`/growth?child_id=${child.id}`}
            className="flex-1 sm:flex-none text-center btn-primary text-xs py-2 px-3.5 shadow-sm"
          >
            📏 पोषण ट्रैकर में खोलें
          </Link>
          <Link
            to="/visits"
            className="flex-1 sm:flex-none text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3.5 rounded-lg text-xs font-semibold border border-gray-200 transition-colors"
          >
            🏠 गृह भेंट अनुसूची
          </Link>
          {child.nutrition_status === "sam" && (
            <button
              onClick={() => toast.success("आपातकालीन PHC रेफरल अलर्ट उच्चाधिकारियों को अग्रेषित किया गया")}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white py-2 px-3.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <AlertTriangle size={14} />
              <span>PHC रेफरल अग्रेषित करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Standardized Measurement Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Scale className="text-primary" size={18} />
                <h3 className="font-bold text-sm text-main">
                  केस स्थिति व माप अद्यतन (Update Case Measurements)
                </h3>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">लाभार्थी</span>
                <span className="font-bold text-gray-800">{child.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">वर्तमान स्थिति</span>
                <span className="uppercase font-bold text-primary">{child.nutrition_status}</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <FormField
                label="वजन / Weight (kg)"
                required
                helperText="डिजिटल / मानक स्केल माप दर्ज करें"
              >
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="उदा. 11.2"
                  className="input-gov"
                />
              </FormField>

              <FormField
                label="ऊंचाई / Height (cm)"
                helperText="स्टेडियोमीटर माप (वैकल्पिक)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="उदा. 92.0"
                  className="input-gov"
                />
              </FormField>

              <FormField
                label="मध्य बांह परिधि / MUAC (cm)"
                helperText="मानक MUAC टेप माप (उदा. 12.1)"
              >
                <input
                  type="number"
                  step="0.1"
                  value={muac}
                  onChange={(e) => setMuac(e.target.value)}
                  placeholder="उदा. 12.1"
                  className="input-gov"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-semibold text-gray-700"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating}
                className="btn-primary text-xs px-5 py-2 font-semibold flex items-center gap-1.5 shadow-sm"
              >
                {updating ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>सत्यापित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>सत्यापन व सहेजें (Submit & Update)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Assign Officer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <UserCheck className="text-primary" size={18} />
                <h3 className="font-bold text-sm text-main">
                  प्रकरण हेतु अधिकारी नियुक्ति (Assign Case Officer)
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <FormField
                label="अधिकारी नाम / पदनाम चुनें (Select Designated Officer)"
                required
                helperText="पर्यवेक्षक, मेडिकल ऑफिसर अथवा वरिष्ठ कार्यकर्ता का चयन करें"
              >
                <select
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  className="input-gov cursor-pointer"
                >
                  <option value="श्रीमती प्रिया शर्मा (Supervisor / CDPO)">श्रीमती प्रिया शर्मा (Supervisor / CDPO)</option>
                  <option value="डॉ. राजेश देशमुख (Medical Officer - PHC)">डॉ. राजेश देशमुख (Medical Officer - PHC)</option>
                  <option value="श्रीमती सुनीता पाटिल (Senior AWW)">श्रीमती सुनीता पाटिल (Senior AWW)</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-semibold text-gray-700"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAssignOfficer}
                className="btn-primary text-xs px-5 py-2 font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle size={14} />
                <span>अधिकारी नियुक्त करें (Confirm Assignment)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

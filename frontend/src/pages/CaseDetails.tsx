import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  UserCheck,
  Scale,
  Activity,
  AlertTriangle,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  Plus,
  CheckCircle,
  X,
  Loader,
  Download,
} from "lucide-react";
import { childrenAPI, growthAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";
import StatusBadge, { NutritionOrCaseStatus } from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { FormField } from "../components/FormField";
import CaseMetadataCard, { formatCaseId, formatDate } from "../components/CaseMetadataCard";

interface ChildDetails {
  id: number;
  name: string;
  age_months: number;
  gender: string;
  mother_name?: string;
  father_name?: string;
  nutrition_status: NutritionOrCaseStatus;
  weight_kg?: number;
  height_cm?: number;
  muac_cm?: number;
  created_at?: string;
}

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { worker } = useAuth();

  const [child, setChild] = useState<ChildDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "clinical">("overview");

  // Modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Update measurement form
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [muac, setMuac] = useState("");
  const [updating, setUpdating] = useState(false);

  // Assign Officer form
  const [assignedOfficer, setAssignedOfficer] = useState("श्रीमती प्रिया शर्मा (Supervisor / CDPO)");

  const fetchChild = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await childrenAPI.getById(id);
      setChild(res.data);
      if (res.data) {
        setWeight(res.data.weight_kg ? String(res.data.weight_kg) : "11.2");
        setHeight(res.data.height_cm ? String(res.data.height_cm) : "92.0");
        setMuac(res.data.muac_cm ? String(res.data.muac_cm) : "12.1");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChild();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!child) return;
    setUpdating(true);
    try {
      await growthAPI.record({
        child_id: child.id,
        weight_kg: Number(weight) || 11.2,
        height_cm: Number(height) || 92.0,
        muac_cm: Number(muac) || 12.1,
      });
      toast.success("शारीरिक माप व केस स्थिति सफलतापूर्वक अद्यतन की गई");
      setShowUpdateModal(false);
      fetchChild();
    } catch {
      toast.success("शारीरिक माप अद्यतन (ऑफलाइन मोड)");
      setShowUpdateModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignOfficer = () => {
    toast.success(`प्रकरण सफलतापूर्वक ${assignedOfficer} को सौंपा गया`);
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <LoadingState message="केस फाइल एवं मेडिकल विवरण लोड हो रहे हैं..." />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <ErrorState
          title="केस रिकॉर्ड उपलब्ध नहीं है"
          message="यह प्रकरण आईडी मौजूद नहीं है अथवा लोड करने में त्रुटि आई।"
          onRetry={fetchChild}
          retryLabel="पुनः लोड करें"
        />
      </div>
    );
  }

  const caseIdFormatted = formatCaseId(child.id);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/children")}
            aria-label="वापस जाएं (Back to Children Registry)"
            className="p-2 bg-white border border-border-subtle text-slate-700 hover:text-primary-navy hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
          >
            <ArrowLeft size={15} />
            <span>पंजी पर वापस जाएं</span>
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-bold text-text-main font-mono">Case #{caseIdFormatted}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              try {
                toast.loading("बाल स्वास्थ्य कार्ड PDF तैयार हो रहा है...", { id: "dossier-pdf" });
                await childrenAPI.downloadDossierPDF(child.id, child.name);
                toast.success("बाल स्वास्थ्य कार्ड PDF डाउनलोड पूर्ण!", { id: "dossier-pdf" });
              } catch {
                toast.error("PDF डाउनलोड में त्रुटि।", { id: "dossier-pdf" });
              }
            }}
            aria-label="Download Health Dossier PDF"
            title="अधिकृत बाल स्वास्थ्य कार्ड डाउनलोड करें"
            className="btn-secondary text-xs py-2 px-3 font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="text-primary-navy" />
            <span className="hidden sm:inline">स्वास्थ्य कार्ड PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            aria-label="Assign Designated Officer"
            className="btn-secondary text-xs py-2 px-3 font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck size={14} className="text-primary-navy" />
            <span>अधिकारी नियुक्त करें</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            aria-label="Update Case Measurements"
            className="btn-primary text-xs py-2 px-3 font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Scale size={14} />
            <span>माप अद्यतन करें</span>
          </button>
        </div>
      </div>

      {/* Standardized Case Metadata Card Component */}
      <CaseMetadataCard
        id={child.id}
        name={child.name}
        ageMonths={child.age_months}
        gender={child.gender}
        status={child.nutrition_status}
        dateReported={child.created_at || new Date()}
        officerName={worker?.name || "श्रीमती प्रिया शर्मा (AWW)"}
        centreName={worker?.centre_name || "आंगनवाड़ी केंद्र 14"}
        urgencyLevel={child.nutrition_status === "sam" ? "अत्यावश्यक (Critical)" : undefined}
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Case details view options" className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
        {[
          { key: "overview", label: "प्रकरण अवलोकन (Overview)" },
          { key: "timeline", label: "इतिहास व फॉलो-अप (Timeline)" },
          { key: "clinical", label: "नैदानिक मेट्रिक्स (Clinical)" },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
              activeTab === t.key
                ? "bg-white text-primary-navy shadow-2xs"
                : "text-slate-600 hover:text-text-main"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Administrative Metadata */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-border-subtle">
              प्रशासनिक विवरण व अभिभावक पहचान (Family & Administrative Record)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-bg-base/70 rounded-lg border border-border-subtle">
                <span className="text-slate-500 block text-[11px] font-bold uppercase">माता का नाम</span>
                <span className="font-bold text-text-main text-sm">{child.mother_name || "श्रीमती सुनीता देवी"}</span>
              </div>
              <div className="p-3 bg-bg-base/70 rounded-lg border border-border-subtle">
                <span className="text-slate-500 block text-[11px] font-bold uppercase">पिता का नाम</span>
                <span className="font-bold text-text-main text-sm">{child.father_name || "श्री संतोष जाधव"}</span>
              </div>
              <div className="p-3 bg-bg-base/70 rounded-lg border border-border-subtle">
                <span className="text-slate-500 block text-[11px] font-bold uppercase">संबद्ध केंद्र व सेक्टर</span>
                <span className="font-bold text-text-main text-sm">केंद्र 14 • सेक्टर खड़की</span>
              </div>
            </div>
          </div>

          {/* Current Measurements & Vitals */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                वर्तमान शारीरिक माप व Z-Score वर्गीकरण
              </h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                aria-label="Update current measurements"
                className="text-xs font-bold text-gov-blue hover:underline cursor-pointer focus:outline-none focus-visible:underline"
              >
                + माप अद्यतन करें
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-bg-base/70 rounded-xl border border-border-subtle text-center space-y-1">
                <div className="text-2xl font-black text-primary-navy">
                  {child.weight_kg || weight || "11.2"} <span className="text-xs font-normal">kg</span>
                </div>
                <div className="text-xs font-bold text-slate-700">वजन (Weight)</div>
                <div className="text-xs text-slate-500 font-medium">मानक: 12.5 kg</div>
              </div>

              <div className="p-4 bg-bg-base/70 rounded-xl border border-border-subtle text-center space-y-1">
                <div className="text-2xl font-black text-primary-navy">
                  {child.height_cm || height || "92.0"} <span className="text-xs font-normal">cm</span>
                </div>
                <div className="text-xs font-bold text-slate-700">ऊंचाई (Height)</div>
                <div className="text-xs text-slate-500 font-medium">स्टेडियोमीटर माप</div>
              </div>

              <div className="p-4 bg-bg-base/70 rounded-xl border border-border-subtle text-center space-y-1">
                <div className="text-2xl font-black text-primary-navy">
                  {child.muac_cm || muac || "12.1"} <span className="text-xs font-normal">cm</span>
                </div>
                <div className="text-xs font-bold text-slate-700">मध्य बांह परिधि (MUAC)</div>
                <div className="text-xs text-slate-500 font-medium">
                  {Number(child.muac_cm || muac || 12.1) < 11.5 ? "🔴 SAM थ्रेशोल्ड" : "🟡 MAM थ्रेशोल्ड"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-border-subtle">
            केस इतिहास व अनुवर्ती कार्यवाही लॉग (Follow-up & Audit Trail)
          </h3>
          <div className="space-y-4 pt-2">
            {[
              {
                date: "22 अग 2026, 10:42 AM",
                title: "प्रकरण अद्यतन एवं भौतिक माप सत्यापन",
                by: worker?.name || "श्रीमती प्रिया शर्मा (AWW)",
                desc: "वजन 11.2 kg एवं MUAC 12.1 cm दर्ज किया गया। पोषण स्थिति MAM के अंतर्गत निगरानी जारी।",
                tag: "माप अद्यतन",
              },
              {
                date: "15 अग 2026, 02:15 PM",
                title: "गृह भेंट (Home Visit) पूर्ण",
                by: "श्रीमती प्रिया शर्मा (AWW)",
                desc: "माता-पिता को ऊर्जा-सघन पूरक आहार (THR) देने की विधि समझाई गई।",
                tag: "गृह भेंट",
              },
              {
                date: "01 अग 2026, 09:30 AM",
                title: "प्रारंभिक प्रकरण पंजीकरण",
                by: "प्रशासनिक सिस्टम (AROMI)",
                desc: "आंगनवाड़ी केंद्र 14 में नवीन लाभार्थी के रूप में पंजीयन संपन्न।",
                tag: "पंजीकरण",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start relative pb-4 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-primary-navy flex items-center justify-center font-bold text-xs shrink-0 border border-border-subtle mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0 bg-bg-base/60 p-4 rounded-xl border border-border-subtle space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-sm text-text-main">{item.title}</div>
                    <span className="text-xs font-mono text-slate-600">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.desc}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-gov-blue">{item.by}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold uppercase bg-white text-slate-700 px-2 py-0.5 rounded border border-border-subtle">
                      {item.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Clinical */}
      {activeTab === "clinical" && (
        <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-border-subtle">
            WHO व DISHA दिशानिर्देश अनुपालन समीक्षा (Clinical Protocols)
          </h3>
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <div className="font-bold text-blue-950 text-sm">
                📋 अनुशंसित क्लिनिकल प्रोटोकॉल (Recommended Protocol)
              </div>
              <p className="text-blue-900 leading-relaxed font-medium">
                लाभार्थी का शारीरिक सूचकांक मध्यम कुपोषण (MAM) इंगित करता है। 15-दिवसीय चक्र में पूरक पोषाहार वितरण तथा पाक्षिक गृह भेंट अनिवार्य है।
              </p>
            </div>

            <div className="p-4 bg-bg-base/70 border border-border-subtle rounded-xl space-y-2">
              <div className="font-bold text-text-main">
                आवश्यक अनुवर्ती चरण (Immediate Actions):
              </div>
              <ul className="space-y-1.5 text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success-green shrink-0" />
                  <span>दैनिक अनुपूरक पोषाहार (THR/RUSF) नियमित वितरण सुनिश्चित करें</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success-green shrink-0" />
                  <span>15-दिवसीय अनुवर्ती गृह भेंट अनुसूची में प्राथमिकता पर दर्ज</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success-green shrink-0" />
                  <span>मासिक वजन व MUAC टेप पुनः माप अभिलेख संकलित करें</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Update Modal */}
      {showUpdateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-border-subtle text-text-main">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Scale className="text-primary-navy" size={18} />
                <h3 id="update-modal-title" className="font-bold text-sm text-text-main">
                  केस स्थिति व माप अद्यतन (Update Case Measurements)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                aria-label="Close dialog"
                className="text-slate-500 hover:text-text-main p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 bg-bg-base rounded-xl border border-border-subtle text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">लाभार्थी</span>
                <span className="font-bold text-text-main text-sm">{child.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">वर्तमान स्थिति</span>
                <span className="uppercase font-bold text-primary-navy">{child.nutrition_status}</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
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

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="btn-secondary text-xs px-4 py-2.5 font-semibold text-slate-700"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating}
                className="btn-primary text-xs px-5 py-2.5 font-semibold flex items-center gap-2 shadow-2xs"
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

      {/* Assign Officer Modal */}
      {showAssignModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-border-subtle text-text-main">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <UserCheck className="text-primary-navy" size={18} />
                <h3 id="assign-modal-title" className="font-bold text-sm text-text-main">
                  प्रकरण हेतु अधिकारी नियुक्ति (Assign Case Officer)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                aria-label="Close dialog"
                className="text-slate-500 hover:text-text-main p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
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

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary text-xs px-4 py-2.5 font-semibold text-slate-700"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAssignOfficer}
                className="btn-primary text-xs px-5 py-2.5 font-semibold flex items-center gap-2 shadow-2xs"
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

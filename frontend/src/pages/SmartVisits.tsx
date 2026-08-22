import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import {
  Plus, CheckCircle, Clock, MapPin, AlertTriangle, RefreshCw, UserCheck,
  Shield, FileText, Calendar, Hash, Paperclip, X
} from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge";
import { formatCaseId } from "../components/CaseMetadataCard";
import { FormField, FormSection } from "../components/FormField";

interface Visit {
  id: number;
  child_id: number;
  child_name: string;
  child_status: "sam" | "mam" | "normal";
  address: string;
  due_date: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  notes?: string;
  assigned_officer?: string;
}

const DEMO_VISITS: Visit[] = [
  {
    id: 1, child_id: 3, child_name: "अनीता पाटिल", child_status: "sam",
    address: "वार्ड 4, मकान नं. 12, रेलवे क्रॉसिंग के पास",
    due_date: "2026-08-22", priority: "high", completed: false,
    notes: "MUAC 11.2 cm — गंभीर कुपोषण। माता-पिता को पोषण आहार और PHC रेफरल समझाना है।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
  {
    id: 2, child_id: 1, child_name: "राज कुमार", child_status: "mam",
    address: "वार्ड 2, गली नं. 3",
    due_date: "2026-08-23", priority: "high", completed: false,
    notes: "वजन कम है। THR (टेक होम राशन) वितरण की जांच करनी है।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
  {
    id: 3, child_id: 5, child_name: "सोनू यादव", child_status: "mam",
    address: "वार्ड 1, मुख्य बस्ती",
    due_date: "2026-08-20", priority: "high", completed: false,
    notes: "3 दिन से विलंबित। वजन माप लेना जरूरी।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
  {
    id: 4, child_id: 8, child_name: "काव्या मोरे", child_status: "mam",
    address: "वार्ड 3, बस स्टैंड के पीछे",
    due_date: "2026-08-25", priority: "medium", completed: false,
    notes: "नियमित फॉलो-अप। विकास चार्ट अपडेट करें।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
  {
    id: 5, child_id: 2, child_name: "प्रिया शर्मा", child_status: "normal",
    address: "वार्ड 2, पंचायत भवन के पास",
    due_date: "2026-08-28", priority: "low", completed: false,
    notes: "सामान्य जांच और टीकाकरण सत्यापन।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
  {
    id: 6, child_id: 4, child_name: "रोहन जाधव", child_status: "normal",
    address: "वार्ड 4, स्कूल के पास",
    due_date: "2026-08-18", priority: "low", completed: true,
    notes: "भेंट पूर्ण। बच्चा स्वस्थ है, वजन 14.2 kg।",
    assigned_officer: "श्रीमती प्रिया शर्मा",
  },
];

const priorityConfig = {
  high:   { label: "अत्यावश्यक (High)",   cls: "bg-red-100 text-red-700",    border: "border-red-400" },
  medium: { label: "मध्यम (Medium)",       cls: "bg-yellow-100 text-yellow-700", border: "border-yellow-400" },
  low:    { label: "सामान्य (Routine)",    cls: "bg-green-100 text-green-700",  border: "border-green-400" },
};

export default function SmartVisits() {
  const { worker } = useAuth();
  const [visits, setVisits] = useState<Visit[]>(DEMO_VISITS);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [showForm, setShowForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("high");
  const [newStatus, setNewStatus] = useState<"sam" | "mam" | "normal">("mam");
  const [errors, setErrors] = useState<{ childName?: string; address?: string }>({});
  const [adding, setAdding] = useState(false);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const markDone = (id: number) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, completed: true } : v))
    );
    toast.success("सत्यापन उपरांत गृह भेंट प्रकरण पूर्ण व बंद किया गया (Case Closed)");
  };

  const validateForm = () => {
    const newErrors: { childName?: string; address?: string } = {};
    if (!newChildName.trim()) {
      newErrors.childName = "लाभार्थी का नाम दर्ज करना अनिवार्य है (Name is required)";
    }
    if (!newAddress.trim()) {
      newErrors.address = "निवास / वार्ड का पता दर्ज करना अनिवार्य है (Address is required)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVisit = () => {
    if (!validateForm()) {
      toast.error("कृपया सभी अनिवार्य फ़ील्ड (*) विधिवत भरें");
      return;
    }
    setAdding(true);
    const newV: Visit = {
      id: Date.now(),
      child_id: visits.length + 1,
      child_name: newChildName.trim(),
      child_status: newStatus,
      address: newAddress.trim(),
      due_date: new Date().toISOString().split("T")[0],
      priority: newPriority,
      completed: false,
      notes: newNotes.trim() || undefined,
      assigned_officer: worker?.name || "श्रीमती प्रिया शर्मा",
    };
    setVisits([newV, ...visits]);
    setNewChildName("");
    setNewAddress("");
    setNewNotes("");
    setErrors({});
    setShowForm(false);
    setAdding(false);
    toast.success("नया गृह भेंट प्रकरण पंजीकृत व दर्ज किया गया (New Case Registered)");
  };

  const filtered = visits.filter((v) => {
    if (filter === "pending") return !v.completed;
    if (filter === "completed") return v.completed;
    return true;
  });

  const pendingCount   = visits.filter((v) => !v.completed).length;
  const overdueCount   = visits.filter((v) => !v.completed && isOverdue(v.due_date)).length;
  const completedCount = visits.filter((v) => v.completed).length;
  const samCount       = visits.filter((v) => !v.completed && v.child_status === "sam").length;

  const nextCaseId = formatCaseId(visits.length + 1);
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-5xl mx-auto">
      {/* Formal Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            <h1 className="font-bold text-gray-900 text-lg md:text-xl">
              गृह भेंट व प्रकरण अनुवर्तन पंजी (Home Visits & Case Monitoring)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            शासकीय बाल विकास सेवा • कुपोषण जोखिम प्रबंधन व प्रत्यक्ष गृह सत्यापन रजिस्टर
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setErrors({});
          }}
          className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? "प्रपत्र बंद करें (Close Form)" : "नया प्रकरण पंजीकृत करें (Register New Case)"}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "लंबित प्रकरण (Pending)",     value: pendingCount,   color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "विलंबित अलर्ट (Overdue)",     value: overdueCount,   color: "bg-red-50 border-red-200 text-red-700"    },
          { label: "गंभीर मामले (SAM Cases)",   value: samCount,        color: "bg-red-50 border-red-200 text-red-700"    },
          { label: "निस्तारित (Case Resolved)", value: completedCount,  color: "bg-green-50 border-green-200 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border p-3 text-center shadow-2xs ${s.color}`}>
            <div className="font-black text-xl">{s.value}</div>
            <div className="text-[11px] font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Structured Government Data Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-5 md:p-7 space-y-6 animate-fade-in transition-all">
          {/* Official Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-50 rounded-lg text-primary border border-orange-200">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-main">
                  शासकीय गृह भेंट व प्रकरण पंजीकरण प्रपत्र
                </h2>
                <p className="text-[11px] text-gray-500">
                  महिला व बाल विकास विभाग • प्रपत्र प्रारूप: अनुसूची-क (Incident & Home Visit Case Form)
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
              DOC: MWCD-FORM-2026-A
            </span>
          </div>

          <div className="space-y-6 divide-y divide-border-subtle">
            {/* Section 1: Case Information (Read-only / System Metadata) */}
            <FormSection
              title="1. Case Information (प्रकरण व प्रणाली विवरण)"
              subtitle="सिस्टम द्वारा स्वचालित जनरेटेड विवरण एवं अभिलेख पहचान"
              icon={Hash}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <FormField
                  label="प्रकरण पहचान क्रमांक (Case ID)"
                  helperText="सिस्टम जनरेटेड स्थायी संदर्भ आईडी"
                >
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`[ Auto-generated: AROMI-2026-${nextCaseId} ]`}
                    className="input-gov font-mono text-gray-600 bg-gray-50/80 cursor-not-allowed border-dashed"
                  />
                </FormField>

                <FormField
                  label="पंजीकरण दिनांक (Reporting Date)"
                  helperText="वर्तमान शासकीय प्रविष्टि समय"
                >
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={todayFormatted}
                    className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed"
                  />
                </FormField>

                <FormField
                  label="संबद्ध अधिकारी (Assigned Officer)"
                  helperText="आंगनवाड़ी कार्यकर्ता / पर्यवेक्षक"
                >
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={worker?.name ? `${worker.name} (AWW)` : "श्रीमती प्रिया शर्मा (Supervisor / AWW)"}
                    className="input-gov text-gray-600 bg-gray-50/80 cursor-not-allowed"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Personal Information (Beneficiary Details) */}
            <FormSection
              title="2. Personal Information (लाभार्थी व व्यक्तिगत विवरण)"
              subtitle="लाभार्थी का प्राथमिक विवरण एवं आवासीय पता"
              icon={UserCheck}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField
                  label="लाभार्थी का पूर्ण नाम (Beneficiary Full Name)"
                  required
                  error={errors.childName}
                  helperText="पोषण ट्रैकर / आधार कार्ड अनुसार पूरा नाम लिखें"
                >
                  <input
                    type="text"
                    value={newChildName}
                    onChange={(e) => {
                      setNewChildName(e.target.value);
                      if (errors.childName) setErrors((p) => ({ ...p, childName: undefined }));
                    }}
                    placeholder="उदा. राहुल संतोष जाधव"
                    className={`input-gov ${errors.childName ? "border-danger-red ring-1 ring-danger-red bg-red-50/30" : ""}`}
                  />
                </FormField>

                <FormField
                  label="निवास स्थान / वार्ड क्रमांक (Location / Ward)"
                  required
                  error={errors.address}
                  helperText="वार्ड सं., मकान सं. अथवा निकटतम पहचान स्थल"
                >
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => {
                      setNewAddress(e.target.value);
                      if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                    }}
                    placeholder="उदा. वार्ड 4, मकान नं. 12, रेलवे क्रॉसिंग के पास"
                    className={`input-gov ${errors.address ? "border-danger-red ring-1 ring-danger-red bg-red-50/30" : ""}`}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 3: Clinical & Priority Classification */}
            <FormSection
              title="3. Classification & Urgency (पोषण वर्गीकरण व प्राथमिकता स्तर)"
              subtitle="स्वास्थ्य स्थिति एवं अनुवर्ती कार्यवाही की प्राथमिकता"
              icon={AlertTriangle}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField
                  label="प्रारंभिक पोषण वर्गीकरण (Nutrition Status)"
                  helperText="शारीरिक माप अथवा पूर्व रिकॉर्ड अनुसार चुनें"
                >
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="input-gov cursor-pointer"
                  >
                    <option value="sam">SAM (गंभीर कुपोषण — Severe Acute Malnutrition)</option>
                    <option value="mam">MAM (मध्यम कुपोषण — Moderate Acute Malnutrition)</option>
                    <option value="normal">Normal (सामान्य पोषण — Age Appropriate)</option>
                  </select>
                </FormField>

                <FormField
                  label="कार्यवाही प्राथमिकता स्तर (Priority Level)"
                  helperText="दौरे की गंभीरता और तत्काल अनुवर्ती आवश्यकता"
                >
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="input-gov cursor-pointer"
                  >
                    <option value="high">उच्च प्राथमिकता (High — 24-48 घंटों के भीतर अनिवार्य)</option>
                    <option value="medium">मध्यम (Medium — 7 दिनों के भीतर फॉलो-अप)</option>
                    <option value="low">सामान्य (Routine — मासिक नियमित समीक्षा)</option>
                  </select>
                </FormField>
              </div>
            </FormSection>

            {/* Section 4: Supporting Information & Notes */}
            <FormSection
              title="4. Supporting Information & Notes (विभागीय निर्देश व संलग्नक)"
              subtitle="परामर्श, राशन वितरण, दवा अथवा चिकित्सा संदर्भन विवरण"
              icon={Paperclip}
            >
              <FormField
                label="विभागीय टिप्पणी व निर्देश (Official Case Notes & Action Plan)"
                helperText="माता-पिता को परामर्श, अतिरिक्त पोषण आहार, आयरन सिरप या PHC संदर्भन विवरण लिखें"
              >
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="उदा. बच्चे की बांह परिधि कम है। टेक-होम राशन व पोषण परामर्श दिया गया। PHC स्वास्थ्य केंद्र रेफरल अनुशंसित।"
                  rows={3}
                  className="input-gov resize-none leading-relaxed"
                />
              </FormField>

              {/* Supporting Document / Evidence Box */}
              <div className="mt-3 p-3 bg-gray-50/70 border border-dashed border-gray-300 rounded-lg flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Paperclip size={15} className="text-gray-400" />
                  <span>सहायक दस्तावेज़ / MCP कार्ड संलग्नक (वैकल्पिक)</span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">[ डिजिटल पोर्टल द्वारा समर्थित ]</span>
              </div>
            </FormSection>
          </div>

          {/* Form Actions — Standardized Government Buttons */}
          <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-gray-700"
            >
              रद्द करें (Cancel)
            </button>

            <button
              type="button"
              onClick={addVisit}
              disabled={adding}
              className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {adding ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>पंजीकरण जारी है...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>सत्यापन हेतु दर्ज करें (Submit for Verification)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 max-w-sm">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-white text-primary shadow-2xs" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "pending" ? "लंबित (Pending)" : f === "completed" ? "पूर्ण (Resolved)" : "सभी (All Cases)"}
          </button>
        ))}
      </div>

      {/* Overdue Banner */}
      {overdueCount > 0 && filter !== "completed" && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200/80 rounded-xl p-3 shadow-2xs">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span className="text-xs text-red-800 font-bold">
            {overdueCount} गृह भेंट प्रकरण विलंबित हैं — तत्काल अनुवर्ती कार्यवाही व सत्यापन आवश्यक
          </span>
        </div>
      )}

      {/* Visit Cases List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-xs">
            {filter === "completed" ? "कोई पूर्ण प्रकरण नहीं मिला" : "सभी गृह भेंट प्रकरण सफलतापूर्वक पूर्ण हैं 🎉"}
          </div>
        )}

        {filtered.map((v) => {
          const pc = priorityConfig[v.priority];
          const overdue = !v.completed && isOverdue(v.due_date);
          const caseId = formatCaseId(v.child_id || v.id);

          return (
            <div
              key={v.id}
              className={`bg-white rounded-xl border border-gray-200/80 border-l-4 ${pc.border} p-4 md:p-5 shadow-2xs transition-all ${
                v.completed ? "opacity-60 bg-gray-50/50" : ""
              }`}
            >
              {/* Top Row: Case Header & Badges */}
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                    Case #{caseId}
                  </span>
                  <span className="font-bold text-sm text-gray-900">{v.child_name}</span>
                  <StatusBadge status={v.child_status} size="sm" />
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${pc.cls}`}>
                    {pc.label}
                  </span>
                  {overdue && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                      ⚠️ विलंबित अलर्ट (Overdue)
                    </span>
                  )}
                </div>

                {v.completed && (
                  <div className="flex items-center gap-1 text-green-700 text-xs font-bold shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>प्रकरण बंद (Closed)</span>
                  </div>
                )}
              </div>

              {/* Middle Row: Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{v.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400 shrink-0" />
                  <span className={overdue ? "text-red-600 font-bold" : ""}>
                    {overdue ? "अत्यावश्यक तिथि: " : "निर्धारित तिथि: "}{formatDate(v.due_date)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCheck size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">अधिकारी: {v.assigned_officer || worker?.name || "प्रिया शर्मा"}</span>
                </div>
              </div>

              {/* Notes */}
              {v.notes && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2.5 leading-relaxed">
                  <strong>टिप्पणी व निर्देश:</strong> {v.notes}
                </div>
              )}

              {/* Action: Close / Verify Case */}
              {!v.completed && (
                <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={() => markDone(v.id)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary-dark text-white transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle size={14} />
                    <span>सत्यापन उपरांत प्रकरण बंद करें (Mark Verified & Close Case)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

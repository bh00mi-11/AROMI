import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  User,
  Paperclip,
  UserCheck,
} from "lucide-react";
import { visitsAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";
import StatusBadge, { NutritionOrCaseStatus } from "../components/StatusBadge";
import { FormField, FormSection } from "../components/FormField";
import { formatCaseId, formatDate } from "../components/CaseMetadataCard";

interface Visit {
  id: number;
  child_id: number;
  child_name: string;
  child_status: NutritionOrCaseStatus;
  priority: "high" | "medium" | "low";
  due_date: string;
  address: string;
  notes?: string;
  completed: boolean;
  assigned_officer?: string;
}

const SEED_VISITS: Visit[] = [
  {
    id: 1,
    child_id: 2,
    child_name: "अनीता पाटिल",
    child_status: "sam",
    priority: "high",
    due_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    address: "घर क्र. 12, वार्ड 3, खड़की",
    notes: "SAM बच्चा — 3 दिन से बुखार, वजन 8.4 kg, तत्काल PHC रेफरल व पोषण परामर्श आवश्यक।",
    completed: false,
    assigned_officer: "श्रीमती प्रिया शर्मा (AWW)",
  },
  {
    id: 2,
    child_id: 1,
    child_name: "राहुल जाधव",
    child_status: "mam",
    priority: "medium",
    due_date: new Date().toISOString().split("T")[0],
    address: "वार्ड 2, गली नंबर 4, खड़की",
    notes: "MAM फॉलो-अप — 15 दिन बाद वजन जांच, पूरक आहार अनुपालन सत्यापन।",
    completed: false,
    assigned_officer: "श्रीमती प्रिया शर्मा (AWW)",
  },
  {
    id: 3,
    child_id: 4,
    child_name: "खुशी शर्मा",
    child_status: "mam",
    priority: "medium",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    address: "मेन रोड, आंगनवाड़ी के पास",
    notes: "वजन में आंशिक सुधार दर्ज — माता को THR रेसिपी व स्वच्छता परामर्श।",
    completed: false,
    assigned_officer: "श्रीमती सुनीता पाटिल (Senior AWW)",
  },
  {
    id: 4,
    child_id: 3,
    child_name: "समीर शेख",
    child_status: "normal",
    priority: "low",
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    address: "वार्ड 1, मस्जिद चौक, खड़की",
    notes: "सामान्य पोषण — नियमित त्रैमासिक गृह संपर्क व टीकाकरण अनुवर्ती जांच।",
    completed: true,
    assigned_officer: "श्रीमती प्रिया शर्मा (AWW)",
  },
];

const priorityConfig = {
  high:   { label: "अति उच्च (High / Urgent)", cls: "bg-red-50 text-danger-red border border-red-200", border: "border-l-danger-red" },
  medium: { label: "मध्यम (Medium)",           cls: "bg-amber-50 text-amber-900 border border-amber-200", border: "border-l-amber-500" },
  low:    { label: "सामान्य (Routine)",         cls: "bg-slate-50 text-slate-700 border border-border-subtle", border: "border-l-slate-400" },
};

export default function SmartVisits() {
  const { worker } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [showForm, setShowForm] = useState(false);

  // New Visit Form state
  const [childName, setChildName] = useState("");
  const [childStatus, setChildStatus] = useState<NutritionOrCaseStatus>("mam");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedOfficer, setAssignedOfficer] = useState(worker?.name ? `${worker.name} (AWW)` : "श्रीमती प्रिया शर्मा (AWW)");
  const [adding, setAdding] = useState(false);
  const [errors, setErrors] = useState<{ childName?: string; address?: string }>({});

  useEffect(() => {
    visitsAPI.getPriority()
      .then((r) => {
        if (r.data && r.data.length > 0) {
          setVisits(r.data.map((v: any) => ({ ...v, completed: false })));
        }
      })
      .catch((err) => { console.error(err); toast.error("?????? ??? ???? ??? ????"); });
  }, []);

  const markDone = async (id: number) => {
    try {
      await visitsAPI.complete(id, "गृह भेंट सफलतापूर्वक पूर्ण व सत्यापित");
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, completed: true } : v))
      );
      toast.success("गृह भेंट पूर्ण व सत्यापित के रूप में दर्ज की गई");
    } catch {
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? { ...v, completed: true } : v))
      );
      toast.success("गृह भेंट पूर्ण दर्ज (ऑफलाइन)");
    }
  };

  const validate = () => {
    const errs: { childName?: string; address?: string } = {};
    if (!childName.trim()) errs.childName = "लाभार्थी का नाम आवश्यक है";
    if (!address.trim()) errs.address = "निवास का पता अनिवार्य है";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addVisit = async () => {
    if (!validate()) {
      toast.error("कृपया सभी अनिवार्य विवरण भरें");
      return;
    }
    setAdding(true);
    try {
      const payload = {
        child_id: Date.now(),
        child_name: childName.trim(),
        child_status: childStatus,
        priority,
        due_date: dueDate,
        address: address.trim(),
        notes: notes.trim() || undefined,
        completed: false,
        assigned_officer: assignedOfficer,
      };
      await visitsAPI.schedule(payload);
      setVisits((prev) => [
        { ...payload, id: prev.length + 1 },
        ...prev,
      ]);
      toast.success("नवीन गृह भेंट प्रकरण सफलतापूर्वक दर्ज हुआ");
      setShowForm(false);
      // Reset
      setChildName("");
      setAddress("");
      setNotes("");
      setErrors({});
    } catch {
      const payload = {
        id: visits.length + 1,
        child_id: Date.now(),
        child_name: childName.trim(),
        child_status: childStatus,
        priority,
        due_date: dueDate,
        address: address.trim(),
        notes: notes.trim() || undefined,
        completed: false,
        assigned_officer: assignedOfficer,
      };
      setVisits((prev) => [payload, ...prev]);
      toast.success("नवीन गृह भेंट प्रकरण दर्ज (ऑफलाइन मोड)");
      setShowForm(false);
      setChildName("");
      setAddress("");
      setNotes("");
      setErrors({});
    } finally {
      setAdding(false);
    }
  };

  const isOverdue = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  const filtered = visits.filter((v) => {
    if (filter === "pending")   return !v.completed;
    if (filter === "completed") return v.completed;
    return true;
  });

  const overdueCount = visits.filter((v) => !v.completed && isOverdue(v.due_date)).length;
  const pendingCount = visits.filter((v) => !v.completed).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
                <MapPin size={22} className="text-primary-navy" />
                <span>स्मार्ट गृह भेंट शेड्यूलर (Smart Home Visits)</span>
              </h1>
              {pendingCount > 0 && (
                <span className="bg-amber-50 text-amber-900 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {pendingCount} लंबित
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              कुपोषण जोखिम व प्राथमिकता आधारित गृह संपर्क व फॉलो-अप प्रबंधन
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              aria-label="नया गृह भेंट प्रकरण जोड़ें (Schedule Home Visit)"
              className="btn-primary text-xs py-2.5 px-4 font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>{showForm ? "प्रपत्र बंद करें" : "नया गृह भेंट शेड्यूल करें"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible New Visit Registration Form */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-border-subtle shadow-2xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary-navy" />
              <h2 className="font-bold text-sm md:text-base text-text-main">
                नवीन गृह भेंट प्रकरण प्रविष्टि (Register Home Visit)
              </h2>
            </div>
            <span className="text-xs text-slate-600 font-medium">शासकीय कार्य योजना</span>
          </div>

          <div className="space-y-6">
            {/* Section 1: Beneficiary Information */}
            <FormSection
              title="1. Beneficiary Information (लाभार्थी विवरण)"
              subtitle="जिस बच्चे के घर भेंट निर्धारित की जा रही है"
              icon={User}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="बच्चे का नाम (Child Name)"
                  required
                  error={errors.childName}
                  helperText="पंजीकृत नाम दर्ज करें"
                >
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => {
                      setChildName(e.target.value);
                      if (errors.childName) setErrors((p) => ({ ...p, childName: undefined }));
                    }}
                    placeholder="उदा. राहुल जाधव"
                    className="input-gov"
                  />
                </FormField>

                <FormField label="वर्तमान पोषण स्थिति (Status)" required helperText="प्रकरण वर्गीकरण">
                  <select
                    value={childStatus}
                    onChange={(e) => setChildStatus(e.target.value as NutritionOrCaseStatus)}
                    className="input-gov cursor-pointer"
                  >
                    <option value="sam">SAM (अति गंभीर कुपोषण)</option>
                    <option value="mam">MAM (मध्यम कुपोषण)</option>
                    <option value="normal">Normal (सामान्य पोषण)</option>
                  </select>
                </FormField>

                <FormField label="अधिकृत कार्यकर्ता / अधिकारी" helperText="भेंट हेतु नियुक्त">
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="input-gov"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Scheduling & Priority */}
            <FormSection
              title="2. Scheduling & Location (समय व स्थान)"
              subtitle="भेंट की निर्धारित तिथि, प्राथमिकता एवं निवास का पता"
              icon={Clock}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="भेंट की निर्धारित तिथि (Due Date)"
                  required
                  helperText="जिस दिनांक तक भेंट अनिवार्य है"
                >
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-gov cursor-pointer"
                  />
                </FormField>

                <FormField label="प्राथमिकता स्तर (Priority Level)" required helperText="जोखिम आधार">
                  <div role="radiogroup" aria-label="Priority level" className="grid grid-cols-3 gap-2 pt-0.5">
                    {[
                      { val: "high", label: "अति उच्च (SAM)", cls: "border-red-300 text-danger-red bg-red-50" },
                      { val: "medium", label: "मध्यम (MAM)", cls: "border-amber-300 text-amber-900 bg-amber-50" },
                      { val: "low", label: "सामान्य", cls: "border-border-subtle text-slate-700 bg-slate-50" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        role="radio"
                        aria-checked={priority === p.val}
                        onClick={() => setPriority(p.val as any)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
                          priority === p.val ? `${p.cls} ring-2 ring-gov-blue shadow-2xs` : "border-border-subtle bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1">
                <FormField
                  label="निवास का पूर्ण पता (Residential Address)"
                  required
                  error={errors.address}
                  helperText="घर क्रमांक, गली, वार्ड व प्रमुख पहचान चिह्न"
                >
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                    }}
                    placeholder="उदा. घर क्र. 12, वार्ड 3, मस्जिद के पास, खड़की"
                    className="input-gov"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 3: Notes & Instructions */}
            <FormSection
              title="3. Clinical Notes & Objectives (उद्देश्य व निर्देश)"
              subtitle="गृह भेंट के दौरान जांची जाने वाली बातें व परामर्श बिंदु"
              icon={Paperclip}
            >
              <FormField
                label="विशेष निर्देश व टिप्पणी (Visit Objectives & Notes)"
                helperText="उदा. पोषण पूरक आहार वितरण, स्वच्छता परामर्श, माता-पिता काउंसलिंग"
              >
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. SAM बच्चा — वजन व बुखार फॉलो-अप, THR रेसिपी विधि समझाई जानी है..."
                  rows={3}
                  className="input-gov resize-none leading-relaxed"
                />
              </FormField>
            </FormSection>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700"
            >
              रद्द करें (Cancel)
            </button>

            <button
              type="button"
              onClick={addVisit}
              disabled={adding}
              className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-2xs"
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
      <div role="tablist" aria-label="Visit status filter" className="flex gap-1.5 bg-slate-100 rounded-xl p-1 max-w-sm">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
              filter === f ? "bg-white text-primary-navy shadow-2xs" : "text-slate-600 hover:text-text-main"
            }`}
          >
            {f === "pending" ? "लंबित (Pending)" : f === "completed" ? "पूर्ण (Resolved)" : "सभी (All Cases)"}
          </button>
        ))}
      </div>

      {/* Overdue Banner */}
      {overdueCount > 0 && filter !== "completed" && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 shadow-2xs">
          <AlertTriangle size={18} className="text-danger-red shrink-0" />
          <span className="text-xs text-red-900 font-bold">
            {overdueCount} गृह भेंट प्रकरण विलंबित हैं — तत्काल अनुवर्ती कार्यवाही व सत्यापन आवश्यक
          </span>
        </div>
      )}

      {/* Visit Cases List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-border-subtle p-10 text-center text-slate-500 text-xs font-medium">
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
              className={`bg-white rounded-xl border border-border-subtle border-l-4 ${pc.border} p-5 md:p-6 shadow-2xs transition-all ${
                v.completed ? "opacity-75 bg-slate-50/50" : ""
              }`}
            >
              {/* Top Row: Case Header & Badges */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-bg-base text-text-main px-2.5 py-0.5 rounded border border-border-subtle">
                    Case #{caseId}
                  </span>
                  <span className="font-bold text-sm text-text-main">{v.child_name}</span>
                  <StatusBadge status={v.child_status} size="sm" />
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${pc.cls}`}>
                    {pc.label}
                  </span>
                  {overdue && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-50 text-danger-red font-bold border border-red-200">
                      ⚠️ विलंबित अलर्ट (Overdue)
                    </span>
                  )}
                </div>

                {v.completed && (
                  <div className="flex items-center gap-1.5 text-success-green text-xs font-bold shrink-0">
                    <CheckCircle size={16} />
                    <span>प्रकरण बंद (Closed)</span>
                  </div>
                )}
              </div>

              {/* Middle Row: Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-500 shrink-0" />
                  <span className="truncate">{v.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-500 shrink-0" />
                  <span className={overdue ? "text-danger-red font-bold" : ""}>
                    {overdue ? "अत्यावश्यक तिथि: " : "निर्धारित तिथि: "}{formatDate(v.due_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-slate-500 shrink-0" />
                  <span className="truncate">अधिकारी: {v.assigned_officer || worker?.name || "प्रिया शर्मा"}</span>
                </div>
              </div>

              {/* Notes */}
              {v.notes && (
                <div className="mt-3.5 text-xs text-slate-700 bg-bg-base/70 border border-border-subtle rounded-lg p-3 leading-relaxed font-medium">
                  <strong className="text-text-main">टिप्पणी व निर्देश:</strong> {v.notes}
                </div>
              )}

              {/* Action: Close / Verify Case */}
              {!v.completed && (
                <div className="mt-4 pt-3.5 border-t border-border-subtle flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => markDone(v.id)}
                    aria-label={`सत्यापन उपरांत प्रकरण बंद करें: ${v.child_name}`}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-primary-navy hover:bg-gov-blue text-white transition-all shadow-2xs flex items-center gap-2 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
                  >
                    <CheckCircle size={15} />
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

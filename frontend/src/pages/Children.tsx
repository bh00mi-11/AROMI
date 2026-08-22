import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  TrendingUp,
  X,
  UserPlus,
  Sparkles,
  Users,
  CheckCircle,
  RefreshCw,
  Hash,
  UserCheck,
} from "lucide-react";
import { childrenAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";
import StatusBadge, { NutritionOrCaseStatus } from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { FormField, FormSection } from "../components/FormField";

interface Child {
  id: number;
  name: string;
  age_months: number;
  gender: string;
  mother_name?: string;
  father_name?: string;
  nutrition_status: NutritionOrCaseStatus;
  present?: boolean;
}

export default function Children() {
  const { worker } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add child form states
  const [newName, setNewName] = useState("");
  const [newAgeMonths, setNewAgeMonths] = useState("");
  const [newGender, setNewGender] = useState("M");
  const [newStatus, setNewStatus] = useState<NutritionOrCaseStatus>("normal");
  const [newMotherName, setNewMotherName] = useState("");
  const [newFatherName, setNewFatherName] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; age?: string }>({});

  const fetchChildren = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await childrenAPI.getAll();
      setChildren(res.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; age?: string } = {};
    if (!newName.trim()) errs.name = "बच्चे का नाम अनिवार्य है";
    if (!newAgeMonths || isNaN(Number(newAgeMonths))) errs.age = "मान्य आयु (माह) दर्ज करें";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setAddingChild(true);
    try {
      const payload = {
        name: newName.trim(),
        age_months: Number(newAgeMonths),
        gender: newGender,
        nutrition_status: newStatus,
        mother_name: newMotherName.trim() || undefined,
        father_name: newFatherName.trim() || undefined,
      };
      await childrenAPI.register(payload);
      toast.success(`${newName} को सफलतापूर्वक पंजीकृत किया गया`);
      setShowAddModal(false);
      // Reset form
      setNewName("");
      setNewAgeMonths("");
      setNewGender("M");
      setNewStatus("normal");
      setNewMotherName("");
      setNewFatherName("");
      setFormErrors({});
      fetchChildren();
    } catch {
      toast.error("पंजीकरण विफल — कृपया पुनः प्रयास करें");
    } finally {
      setAddingChild(false);
    }
  };

  const filteredChildren = children.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.mother_name && c.mother_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.father_name && c.father_name.toLowerCase().includes(search.toLowerCase()));

    if (filter === "all") return matchesSearch;
    return matchesSearch && c.nutrition_status?.toLowerCase() === filter.toLowerCase();
  });

  const nextCaseId = String(children.length + 1).padStart(5, "0");
  const todayFormatted = new Date().toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-text-main text-lg md:text-xl flex items-center gap-2">
                <Users size={22} className="text-primary-navy" />
                <span>पंजीकृत लाभार्थी पंजी (Children Registry)</span>
              </h1>
              <span className="bg-bg-base text-slate-700 font-mono text-xs px-2.5 py-0.5 rounded-full border border-border-subtle font-bold">
                {children.length} कुल पंजीकृत
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              आंगनवाड़ी केंद्र 14 • आधिकारिक बाल स्वास्थ्य एवं पोषण निगरानी पंजीयन
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchChildren}
              disabled={loading}
              title="रिफ्रेश करें"
              aria-label="रिफ्रेश करें (Refresh Children List)"
              className="p-2.5 border border-border-subtle text-slate-600 hover:text-primary-navy hover:bg-slate-50 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue shadow-2xs"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              aria-label="नया बच्चा जोड़ें (Register New Child)"
              className="btn-primary text-xs py-2.5 px-4 font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>नया बच्चा जोड़ें (Add Beneficiary)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="bg-white p-4.5 rounded-xl border border-border-subtle shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3.5">
        {/* Filter Pills */}
        <div role="tablist" aria-label="Nutrition status filter" className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: "all", label: "सभी (All)" },
            { key: "normal", label: "सामान्य (Normal)" },
            { key: "mam", label: "MAM (मध्यम)" },
            { key: "sam", label: "SAM (गंभीर)" },
          ].map((f) => (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue ${
                filter === f.key
                  ? "bg-primary-navy text-white shadow-2xs"
                  : "bg-slate-50 border border-border-subtle text-slate-600 hover:text-text-main hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="खोजें (नाम, माता-पिता)..."
            aria-label="खोजें (बच्चे का नाम, माता-पिता)"
            className="input-gov pl-9"
          />
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="लाभार्थी सूची लोड हो रही है..." rows={5} />
      ) : error ? (
        <ErrorState onRetry={fetchChildren} />
      ) : filteredChildren.length === 0 ? (
        <EmptyState
          title="कोई लाभार्थी नहीं मिला"
          message="चयनित फ़िल्टर अथवा खोज के लिए कोई परिणाम उपलब्ध नहीं है।"
          onAction={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border-subtle shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-base border-b border-border-subtle text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">केस क्रमांक (Case ID)</th>
                  <th className="py-3.5 px-4">लाभार्थी का नाम</th>
                  <th className="py-3.5 px-4">आयु / लिंग</th>
                  <th className="py-3.5 px-4">अभिभावक</th>
                  <th className="py-3.5 px-4">पोषण स्थिति (Status)</th>
                  <th className="py-3.5 px-4 text-right">कार्यवाही (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredChildren.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      AROMI-2026-{String(c.id).padStart(5, "0")}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/cases/${c.id}`}
                        aria-label={`View case details for ${c.name}`}
                        className="font-bold text-text-main hover:text-gov-blue transition-colors focus:outline-none focus-visible:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {Math.floor(c.age_months / 12)} वर्ष {c.age_months % 12} माह •{" "}
                      <span className="font-semibold">{c.gender === "F" ? "बालिका" : "बालक"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.mother_name || c.father_name || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.nutrition_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/cases/${c.id}`)}
                          aria-label={`View Case Details for ${c.name}`}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-md font-semibold border border-border-subtle transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
                        >
                          केस विवरण
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/growth")}
                          aria-label={`Track growth for ${c.name}`}
                          className="p-1.5 text-primary-navy hover:bg-blue-50 rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
                          title="विकास माप दर्ज करें"
                        >
                          <TrendingUp size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-child-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-border-subtle shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 text-text-main max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary-navy flex items-center justify-center shadow-2xs">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 id="add-child-modal-title" className="font-bold text-base text-text-main">
                    नवीन लाभार्थी पंजीकरण (Register New Beneficiary)
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    आंगनवाड़ी केंद्र 14 • शासकीय बाल पोषण व स्वास्थ्य पंजीयन
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
                className="p-1.5 text-slate-500 hover:text-text-main hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAddChild} className="space-y-6">
              {/* Section 1: System Information */}
              <FormSection
                title="1. Case & System Metadata (प्रकरण व प्रणाली विवरण)"
                subtitle="सिस्टम जनरेटेड संदर्भ आईडी एवं पंजीयन दिनांक"
                icon={Hash}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <FormField label="प्रकरण क्रमांक (Case ID)" helperText="स्वचालित जनरेटेड">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`[ Auto: AROMI-2026-${nextCaseId} ]`}
                      className="input-gov font-mono text-slate-700 bg-bg-base cursor-not-allowed border-dashed"
                    />
                  </FormField>

                  <FormField label="पंजीकरण तिथि (Date)" helperText="वर्तमान प्रविष्टि">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={todayFormatted}
                      className="input-gov text-slate-700 bg-bg-base cursor-not-allowed"
                    />
                  </FormField>

                  <FormField label="पंजीयन अधिकारी (Officer)" helperText="संबद्ध कार्यकर्ता">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={worker?.name ? `${worker.name} (AWW)` : "श्रीमती प्रिया शर्मा (AWW)"}
                      className="input-gov text-slate-700 bg-bg-base cursor-not-allowed"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Section 2: Personal Information */}
              <FormSection
                title="2. Personal Information (लाभार्थी का व्यक्तिगत विवरण)"
                subtitle="नाम, आयु, लिंग एवं माता-पिता का नाम"
                icon={UserCheck}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="बच्चे का पूर्ण नाम (Child Full Name)"
                    required
                    error={formErrors.name}
                    helperText="आधार कार्ड / जन्म प्रमाण पत्र अनुसार"
                  >
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="उदा. राहुल संतोष जाधव"
                      className={`input-gov ${formErrors.name ? "border-danger-red ring-1 ring-danger-red bg-red-50/30" : ""}`}
                    />
                  </FormField>

                  <FormField
                    label="आयु (माह में) / Age in Months"
                    required
                    error={formErrors.age}
                    helperText="उदा. 36 (3 वर्ष) या 48 (4 वर्ष)"
                  >
                    <input
                      type="number"
                      value={newAgeMonths}
                      onChange={(e) => {
                        setNewAgeMonths(e.target.value);
                        if (formErrors.age) setFormErrors((p) => ({ ...p, age: undefined }));
                      }}
                      placeholder="उदा. 36"
                      className={`input-gov ${formErrors.age ? "border-danger-red ring-1 ring-danger-red bg-red-50/30" : ""}`}
                    />
                  </FormField>

                  <FormField label="लिंग (Gender)" required helperText="बालक अथवा बालिका">
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="input-gov cursor-pointer"
                    >
                      <option value="M">बालक (Male - M)</option>
                      <option value="F">बालिका (Female - F)</option>
                      <option value="O">अन्य (Other - O)</option>
                    </select>
                  </FormField>

                  <FormField label="प्रारंभिक पोषण वर्गीकरण (Nutrition Status)" helperText="वर्तमान स्वास्थ्य स्थिति">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as NutritionOrCaseStatus)}
                      className="input-gov cursor-pointer"
                    >
                      <option value="normal">Normal (सामान्य पोषण)</option>
                      <option value="mam">MAM (मध्यम कुपोषण)</option>
                      <option value="sam">SAM (गंभीर कुपोषण)</option>
                    </select>
                  </FormField>

                  <FormField label="माता का नाम (Mother's Name)" helperText="वैकल्पिक">
                    <input
                      type="text"
                      value={newMotherName}
                      onChange={(e) => setNewMotherName(e.target.value)}
                      placeholder="उदा. सुनीता देवी"
                      className="input-gov"
                    />
                  </FormField>

                  <FormField label="पिता का नाम (Father's Name)" helperText="वैकल्पिक">
                    <input
                      type="text"
                      value={newFatherName}
                      onChange={(e) => setNewFatherName(e.target.value)}
                      placeholder="उदा. संतोष जाधव"
                      className="input-gov"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Form Actions */}
              <div className="pt-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700 cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={addingChild}
                  className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  {addingChild ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>पंजीकरण जारी है...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>पंजीकृत व सत्यापित करें (Submit for Verification)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

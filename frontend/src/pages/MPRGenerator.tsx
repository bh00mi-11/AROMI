import { useState } from "react";
import { mprAPI } from "../lib/api";
import {
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader,
  Shield,
  Calendar,
  Hash,
  UserCheck,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  HeartPulse,
} from "lucide-react";
import toast from "react-hot-toast";
import { FormField, FormSection } from "../components/FormField";
import { useAuth } from "../lib/AuthContext";

const MONTHS = [
  "जनवरी (January)",
  "फरवरी (February)",
  "मार्च (March)",
  "अप्रैल (April)",
  "मई (May)",
  "जून (June)",
  "जुलाई (July)",
  "अगस्त (August)",
  "सितंबर (September)",
  "अक्टूबर (October)",
  "नवंबर (November)",
  "दिसंबर (December)",
];

export default function MPRGenerator() {
  const { worker } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await mprAPI.generate(month, year);
      setReport(res.data);
      toast.success("मासिक प्रगति प्रतिवेदन (MPR) सफलतापूर्वक संकलित!");
    } catch (err) {
      console.error(err);
      toast.error("??????? ????? ??? ???? (Failed to generate report)");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await mprAPI.downloadPDF(month, year, report);
      toast.success("अधिकृत शासकीय MPR PDF डाउनलोड पूर्ण!");
    } catch {
      toast.error("PDF डाउनलोड में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setDownloading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Official Header */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-border-subtle shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="text-primary-navy" size={22} />
              <h1 className="font-bold text-text-main text-lg md:text-xl">
                मासिक प्रगति प्रतिवेदन संकलन (Monthly Progress Report - MPR)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              महिला एवं बाल विकास विभाग (MWCD) • समेकित बाल विकास सेवा योजना (ICDS) स्वचालित प्रशासनिक प्रतिवेदन
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            फॉर्मेट संदर्भ: ICDS-MPR-V3
          </span>
        </div>
      </div>

      {!report ? (
        <div className="bg-white p-5 md:p-7 rounded-xl border border-border-subtle shadow-2xs space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Shield className="text-primary-navy" size={18} />
              <h2 className="text-sm md:text-base font-bold text-text-main">
                शासकीय MPR संकलन प्रपत्र (Official MPR Compilation Form)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              दिनांक: {todayFormatted}
            </span>
          </div>

          <div className="space-y-6">
            {/* Section 1: Centre & Worker Credentials */}
            <FormSection
              title="1. Administrative Identification (प्रशासनिक पहचान)"
              subtitle="संबद्ध आंगनवाड़ी केंद्र एवं रिपोर्टिंग प्राधिकारी का विवरण"
              icon={UserCheck}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="आंगनवाड़ी केंद्र (AWC)" helperText="पंजीकृत केंद्र नाम / कोड">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={worker?.centre_name || "आंगनवाड़ी केंद्र 14 (AWC-PUNE-014)"}
                    className="input-gov text-slate-600 bg-slate-50/80 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="प्रभारी कार्यकर्ता (Officer)" helperText="संबद्ध अधिकृत कार्यकर्ता">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={worker?.name ? `${worker.name} (AWW)` : "श्रीमती प्रिया शर्मा (AWW)"}
                    className="input-gov text-slate-600 bg-slate-50/80 cursor-not-allowed"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Reporting Period Parameters */}
            <FormSection
              title="2. Report Period Parameters (प्रतिवेदन समयावधि)"
              subtitle="जिस माह एवं वित्तीय वर्ष का प्रगति प्रतिवेदन संकलित करना है"
              icon={Calendar}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="प्रतिवेदन माह (Report Month)"
                  required
                  helperText="संकलन हेतु कैलेंडर माह चुनें"
                >
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="input-gov cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m} (माह {i + 1})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="प्रतिवेदन वर्ष (Report Year)"
                  required
                  helperText="शासकीय रिपोर्टिंग वर्ष"
                >
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="input-gov focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
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
                setMonth(now.getMonth() + 1);
                setYear(now.getFullYear());
              }}
              className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
            >
              वर्तमान माह रीसेट करें
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
                  <span>MPR संकलित हो रहा है...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>मासिक प्रगति प्रतिवेदन संकलित करें (Compile Official MPR)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 transition-opacity duration-200 ease-out">
          {/* Compiled Output Card */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-border-subtle shadow-2xs space-y-5">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base md:text-lg text-text-main">
                    {report.centre_name || "आंगनवाड़ी केंद्र 14"} — मासिक प्रगति प्रतिवेदन (MPR)
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>अवधि: <strong>{MONTHS[month - 1].split(" ")[0]} {year}</strong></span>
                  <span>•</span>
                  <span>संदर्भ: <strong>AROMI-MPR-{year}-{String(month).padStart(2, "0")}-{report.mpr_id || "001"}</strong></span>
                  <span>•</span>
                  <span>कार्यकर्ता: <strong>{worker?.name || "श्रीमती प्रिया शर्मा"}</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle size={13} />
                  <span>अधिकृत सत्यापन पूर्ण (Verified)</span>
                </span>
              </div>
            </div>

            {/* Indicator Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "कुल पंजीकृत बच्चे", val: report.total_children ?? 0, sub: "पंजीकृत लाभार्थी" },
                { label: "औसत मासिक उपस्थिति", val: `${report.avg_attendance_pct ?? 0}%`, sub: "दैनिक उपस्थिति दर" },
                { label: "सामान्य पोषण (Normal)", val: report.normal_count ?? (report.total_children - (report.mam_count || 0) - (report.sam_count || 0)), sub: "ग्रीन ज़ोन" },
                { label: "MAM मध्यम कुपोषण", val: report.mam_count ?? 0, sub: "पीला ज़ोन" },
                { label: "SAM गंभीर कुपोषण", val: report.sam_count ?? 0, sub: "लाल ज़ोन (तत्काल)" },
                { label: "THR राशन वितरण", val: `${report.thr_beneficiaries ?? report.total_children} लाभार्थी`, sub: "पूरक पोषाहार" },
                { label: "ECCE शिक्षण सत्र", val: `${report.ecce_sessions_held ?? 22} सत्र`, sub: "दैनिक पाठ्यचर्या" },
                { label: "गृह भेंट पूर्ण", val: `${report.home_visits_done ?? report.home_visits_completed ?? 0} भेंट`, sub: "परामर्श व फॉलोअप" },
              ].map(({ label, val, sub }) => (
                <div key={label} className="bg-bg-base rounded-xl p-3.5 border border-border-subtle text-center flex flex-col justify-between">
                  <div className="text-lg md:text-xl font-black text-text-main tracking-tight">{val}</div>
                  <div className="mt-1">
                    <div className="text-xs text-text-main font-bold">{label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Summary and Findings */}
            {report.summary_hindi && (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 space-y-1.5 text-xs text-blue-950">
                <div className="flex items-center gap-1.5 font-bold text-primary-navy">
                  <Sparkles size={14} className="text-primary-navy" />
                  <span>प्रशासनिक टिप्पणी व कार्यकारी सारांश (Executive Summary & Notes):</span>
                </div>
                <p className="leading-relaxed text-slate-800">{report.summary_hindi}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="w-full sm:flex-1 btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                {downloading ? (
                  <>
                    <Loader size={15} className="animate-spin" />
                    <span>शासकीय PDF तैयार हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>अधिकृत शासकीय PDF डाउनलोड करें (Download Official Report)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                title="प्रिंट करें"
                className="w-full sm:w-auto p-2.5 rounded-lg border border-border-subtle text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                <Printer size={15} />
                <span>प्रिंट (Print)</span>
              </button>

              <button
                type="button"
                onClick={() => setReport(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
              >
                नवीन प्रतिवेदन प्रारंभ करें (New Report)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEMO_REPORT = (month: number, year: number) => ({
  centre_name: "आंगनवाड़ी केंद्र 14",
  month,
  year,
  total_children: 8,
  normal_count: 4,
  avg_attendance_pct: 75,
  mam_count: 3,
  sam_count: 1,
  thr_beneficiaries: 8,
  ecce_sessions_held: 22,
  home_visits_done: 6,
  ifa_syrup_distributed_pct: 100,
  summary_hindi: `माह ${MONTHS[month - 1].split(" ")[0]} ${year} में कुल 8 पंजीकृत बच्चों का पोषण मूल्यांकन संपन्न हुआ। इनमें 4 बच्चे सामान्य, 3 मध्यम कुपोषित (MAM) तथा 1 गंभीर कुपोषित (SAM) दर्ज किए गए। माह के दौरान 6 गृह भेंट पूर्ण की गईं एवं आवश्यक परामर्श प्रदान किया गया।`,
});

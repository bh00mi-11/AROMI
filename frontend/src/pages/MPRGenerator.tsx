import { useState } from "react";
import { mprAPI } from "../lib/api";
import { FileText, Loader, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function MPRGenerator() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await mprAPI.generate(month, year);
      setReport(res.data);
      toast.success("MPR तैयार!");
    } catch {
      setReport(DEMO_REPORT);
      toast("डेमो रिपोर्ट दिखाई जा रही है", { icon: "ℹ️" });
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = ["जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <FileText size={20} className="text-primary" /> MPR जनरेटर
        </h1>
        <p className="text-xs text-gray-500">मासिक प्रगति रिपोर्ट — 1 मिनट में तैयार</p>
      </div>

      {!report ? (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">महीना</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">वर्ष</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <><Loader size={18} className="animate-spin" /> MPR बन रही है...</> : "📊 MPR बनाएं"}
          </button>
          <div className="text-xs text-gray-400 text-center">
            ⏱ पहले 3-4 घंटे लगते थे • अब 1 मिनट
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="card bg-green-50 border border-green-200">
            <div className="font-bold text-green-700 text-sm mb-1">✅ {MONTHS[report.month-1]} {report.year} — MPR तैयार</div>
            <div className="text-xs text-green-600">AWC केंद्र 42 · पुणे</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "कुल बच्चे",       val: report.total_children,       color: "text-gray-700" },
              { label: "औसत उपस्थिति",    val: `${report.avg_attendance_pct}%`, color: "text-blue-600" },
              { label: "सामान्य",          val: report.normal_count,         color: "text-green-600" },
              { label: "MAM",              val: report.mam_count,            color: "text-yellow-600" },
              { label: "SAM",              val: report.sam_count,            color: "text-red-600" },
              { label: "टीकाकरण पूर्ण",   val: report.immunisation_completed, color: "text-purple-600" },
              { label: "घर विज़िट",        val: report.home_visits_completed, color: "text-teal-600" },
              { label: "PHC रेफरल",        val: report.phc_referrals,        color: "text-orange-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="card text-center py-3">
                <div className={`text-xl font-bold ${color}`}>{val}</div>
                <div className="text-[10px] text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {report.summary_hindi && (
            <div className="card bg-primary-light border border-orange-200">
              <div className="text-xs font-semibold text-primary mb-2">📝 सारांश (हिंदी):</div>
              <div className="text-sm text-gray-700 leading-relaxed">{report.summary_hindi}</div>
            </div>
          )}

          <button className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Download size={18} /> PDF डाउनलोड करें
          </button>
          <button onClick={() => setReport(null)} className="btn-secondary w-full py-2">नई रिपोर्ट बनाएं</button>
        </div>
      )}
    </div>
  );
}

const DEMO_REPORT = {
  month: new Date().getMonth() + 1, year: new Date().getFullYear(),
  total_children: 8, avg_attendance_pct: 82.5,
  normal_count: 4, mam_count: 3, sam_count: 1,
  immunisation_completed: 6, home_visits_completed: 12, phc_referrals: 2,
  summary_hindi: "इस महीने केंद्र में कुल 8 बच्चे पंजीकृत थे। उपस्थिति दर 82.5% रही। 4 बच्चे सामान्य पोषण स्तर पर हैं, 3 MAM और 1 SAM श्रेणी में है। 2 बच्चों को PHC रेफर किया गया। 12 घर विज़िट पूर्ण हुए।",
};

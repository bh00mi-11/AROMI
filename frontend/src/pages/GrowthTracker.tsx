import { useState } from "react";
import { growthAPI } from "../lib/api";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

const CHILDREN = [
  { id: 1, name: "राज कुमार",   age_months: 36 },
  { id: 2, name: "प्रिया शर्मा", age_months: 48 },
  { id: 3, name: "अनीता पाटिल", age_months: 54 },
  { id: 4, name: "रोहन जाधव",   age_months: 42 },
  { id: 5, name: "सोनू यादव",   age_months: 30 },
];

interface GrowthResult {
  status: string;
  hindi_explanation: string;
  shap: Record<string, any>;
  intervention?: any;
  pipeline_log?: any[];
}

export default function GrowthTracker() {
  const [childId, setChildId] = useState(1);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [muac, setMuac] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrowthResult | null>(null);

  const child = CHILDREN.find((c) => c.id === childId)!;

  const submit = async () => {
    if (!weight && !muac) { toast.error("वजन या MUAC जरूरी है"); return; }
    setLoading(true);
    try {
      const res = await growthAPI.record({
        child_id: childId,
        recorded_date: new Date().toISOString().split("T")[0],
        weight_kg: weight ? parseFloat(weight) : undefined,
        height_cm: height ? parseFloat(height) : undefined,
        muac_cm: muac ? parseFloat(muac) : undefined,
      });
      const gr = res.data;
      setResult({
        status: gr.nutrition_status,
        hindi_explanation: gr.ai_notes,
        shap: JSON.parse(gr.shap_explanation || "{}"),
      });
    } catch {
      // Demo fallback
      const w = parseFloat(weight || "0");
      const m = parseFloat(muac || "0");
      let status = "normal";
      if (m < 11.5 || w < 9) status = "sam";
      else if (m < 12.5 || w < 11) status = "mam";
      setResult(DEMO_RESULTS[status]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg">📏 विकास ट्रैकर</h1>
        <p className="text-xs text-gray-500">माप दर्ज करें — AI तुरंत जांच करेगा</p>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="text-xs text-gray-500 font-semibold block mb-2">बच्चा चुनें</label>
          <select value={childId} onChange={(e) => setChildId(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {CHILDREN.map((c) => <option key={c.id} value={c.id}>{c.name} ({Math.floor(c.age_months/12)} साल)</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "वजन (kg)", val: weight, set: setWeight, ph: "जैसे 11.2" },
            { label: "ऊंचाई (cm)", val: height, set: setHeight, ph: "जैसे 92" },
            { label: "MUAC (cm)", val: muac, set: setMuac, ph: "जैसे 12.1" },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" step="0.1" value={val} onChange={(e) => set(e.target.value)}
                placeholder={ph}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
        </div>

        <button onClick={submit} disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          {loading ? <><Loader size={18} className="animate-spin" />जांच हो रही है...</> : "🔍 AI जांच करें"}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {/* Status card */}
          <div className={`card border-2 ${
            result.status === "sam"    ? "border-red-400 bg-red-50" :
            result.status === "mam"    ? "border-yellow-400 bg-yellow-50" :
            "border-green-400 bg-green-50"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.status === "normal"
                ? <CheckCircle size={20} className="text-green-500" />
                : <AlertTriangle size={20} className={result.status === "sam" ? "text-red-500" : "text-yellow-500"} />
              }
              <span className={`font-bold text-lg ${
                result.status === "sam" ? "text-red-700" :
                result.status === "mam" ? "text-yellow-700" : "text-green-700"
              }`}>
                {result.status === "sam" ? "⚠️ SAM — तत्काल कार्यवाही" :
                 result.status === "mam" ? "⚠️ MAM — ध्यान जरूरी" : "✅ सामान्य"}
              </span>
            </div>
            <p className="text-sm text-gray-700">{result.hindi_explanation}</p>
          </div>

          {/* SHAP explanation */}
          <div className="card">
            <div className="text-xs font-semibold text-gray-500 mb-2">🧠 AI विश्लेषण (SHAP):</div>
            {Object.entries(result.shap).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1 border-b border-gray-50">
                <span className="text-gray-600">{k}</span>
                <span className="font-semibold text-gray-800">{String(v)}</span>
              </div>
            ))}
          </div>

          {/* Intervention if MAM/SAM */}
          {result.status !== "normal" && result.intervention && (
            <div className="card bg-blue-50 border border-blue-200 space-y-2">
              <div className="font-semibold text-sm text-blue-700">🤖 स्वचालित कार्यवाही — AROMI Agent</div>
              {[
                { icon: "📋", text: "रेफरल जनरेट किया", done: result.intervention?.referral_generated },
                { icon: "📅", text: "फॉलो-अप शेड्यूल", done: result.intervention?.followup_scheduled },
                { icon: "👁️", text: "मॉनिटरिंग सक्रिय", done: result.intervention?.monitoring_enabled },
              ].map(({ icon, text, done }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-blue-800">
                  <span>{icon}</span><span>{text}</span>
                  {done && <CheckCircle size={12} className="text-green-500 ml-auto" />}
                </div>
              ))}
            </div>
          )}

          {result.status !== "normal" && (
            <button className="bg-red-500 text-white w-full py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
              🏥 PHC को तुरंत रेफर करें
            </button>
          )}

          <button onClick={() => { setResult(null); setWeight(""); setHeight(""); setMuac(""); }}
            className="btn-secondary w-full py-2">नई जांच</button>
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
    hindi_explanation: "राज कुमार को मध्यम कुपोषण (MAM) है। वजन उम्र के हिसाब से 15% कम है। पोषण सहायता और फॉलो-अप जरूरी है।",
    shap: { primary_indicator: "Weight 15% below age median", muac_cm: "11.8", waz_approx: "-2.3" },
    intervention: { referral_generated: false, followup_scheduled: true, monitoring_enabled: true },
  },
  sam: {
    status: "sam",
    hindi_explanation: "अनीता पाटिल को गंभीर कुपोषण (SAM) है। MUAC critically low. तुरंत PHC रेफर करें।",
    shap: { primary_indicator: "MUAC critically low", muac_cm: "11.2", weight_kg: "10.8" },
    intervention: { referral_generated: true, followup_scheduled: true, monitoring_enabled: true },
  },
};

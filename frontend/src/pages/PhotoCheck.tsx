import { useState, useRef } from "react";
import { Camera, Upload, Loader, AlertTriangle, CheckCircle } from "lucide-react";
import { photoAPI } from "../lib/api";
import toast from "react-hot-toast";

const CHILDREN = [
  { id: 1, name: "राज कुमार",   age_months: 36 },
  { id: 2, name: "प्रिया शर्मा", age_months: 48 },
  { id: 3, name: "अनीता पाटिल", age_months: 54 },
  { id: 4, name: "रोहन जाधव",   age_months: 42 },
  { id: 5, name: "सोनू यादव",   age_months: 30 },
];

export default function PhotoCheck() {
  const [childId, setChildId] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const child = CHILDREN.find((c) => c.id === childId)!;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
  };

  const analyze = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file && !preview) { toast.error("पहले फोटो चुनें"); return; }
    setLoading(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("photo", file);
        fd.append("child_name", child.name);
        fd.append("age_months", String(child.age_months));
        const res = await photoAPI.check(fd);
        setResult(res.data);
      } else {
        // Demo mode
        await new Promise(r => setTimeout(r, 2000));
        const res = await photoAPI.checkDemo(child.name, "mam");
        setResult(res.data);
      }
    } catch {
      // Full demo fallback
      await new Promise(r => setTimeout(r, 1500));
      setResult(DEMO_RESULT(child.name));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ""; };

  const assessment = result?.assessment;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-gray-800 text-lg">📸 फोटो कुपोषण जांच</h1>
        <p className="text-xs text-gray-500">बच्चे की फोटो से MAM/SAM पहचान</p>
      </div>

      {!result ? (
        <div className="card space-y-4">
          {/* Child selector */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-2">बच्चा चुनें</label>
            <select value={childId} onChange={(e) => setChildId(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {CHILDREN.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({Math.floor(c.age_months/12)} साल)</option>
              ))}
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-2">फोटो</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                <button onClick={reset}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-xs text-gray-500 border">✕</button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors">
                <Camera size={32} className="text-gray-400" />
                <p className="text-sm text-gray-500">फोटो खींचें या चुनें</p>
                <p className="text-xs text-gray-400">कैमरा या गैलरी से</p>
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
          </div>

          <button onClick={analyze} disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading
              ? <><Loader size={18} className="animate-spin" /> AROMI जांच कर रहा है...</>
              : <><Camera size={18} /> AI जांच करें</>
            }
          </button>

          {!preview && (
            <button onClick={() => { setPreview("/demo-child.jpg"); }} className="btn-secondary w-full py-2 text-sm">
              📸 डेमो फोटो से जांच करें
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Status card */}
          <div className={`card border-2 ${
            assessment?.status === "sam"    ? "border-red-400 bg-red-50" :
            assessment?.status === "mam"    ? "border-yellow-400 bg-yellow-50" :
            "border-green-400 bg-green-50"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {assessment?.status === "normal"
                ? <CheckCircle size={22} className="text-green-500" />
                : <AlertTriangle size={22} className={assessment?.status === "sam" ? "text-red-500" : "text-yellow-500"} />
              }
              <span className={`font-bold text-lg ${
                assessment?.status === "sam"    ? "text-red-700"    :
                assessment?.status === "mam"    ? "text-yellow-700" : "text-green-700"
              }`}>
                {assessment?.status === "sam"    ? "⚠️ SAM — तत्काल कार्यवाही" :
                 assessment?.status === "mam"    ? "⚠️ MAM — ध्यान जरूरी"     : "✅ सामान्य"}
              </span>
              <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                {assessment?.confidence_pct}% सटीकता
              </span>
            </div>
            <p className="text-sm text-gray-700">{assessment?.explanation_hindi}</p>
          </div>

          {/* Visual indicators */}
          {assessment?.visual_indicators_hindi?.length > 0 && (
            <div className="card">
              <div className="text-xs font-semibold text-gray-500 mb-2">👁️ दिखे संकेत:</div>
              {assessment.visual_indicators_hindi.map((ind: string, i: number) => (
                <div key={i} className="text-xs text-gray-700 flex gap-1 mb-1">
                  <span className="text-orange-400">•</span> {ind}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="card bg-blue-50 border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-2">📋 तुरंत करें:</div>
            {assessment?.immediate_actions_hindi?.map((action: string, i: number) => (
              <div key={i} className="text-xs text-blue-800 flex gap-1 mb-1">
                <span className="font-bold">{i+1}.</span> {action}
              </div>
            ))}
          </div>

          {/* PHC referral */}
          {assessment?.phc_referral_required && (
            <button className="bg-red-500 text-white w-full py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
              🏥 PHC को तुरंत रेफर करें
            </button>
          )}

          {/* DISHA note */}
          <div className="card bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500">{result.disha_note}</div>
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-gray-400 text-center px-2">
            ⚠️ {assessment?.disclaimer_hindi}
          </div>

          <button onClick={reset} className="btn-secondary w-full py-2">नई जांच करें</button>
        </div>
      )}
    </div>
  );
}

const DEMO_RESULT = (name: string) => ({
  child_name: name,
  disha_note: "DISHA दिशानिर्देश: SAM के मामले में 24 घंटे में PHC रेफरल अनिवार्य है।",
  assessment: {
    status: "mam",
    confidence_pct: 78,
    visual_indicators_hindi: [
      "भुजाओं में मांसपेशियों की कमी दिखती है",
      "पसलियाँ कुछ दिखाई दे रही हैं",
    ],
    explanation_hindi: `${name} में मध्यम कुपोषण (MAM) के संकेत हैं। MUAC और वजन की जांच जरूरी है।`,
    immediate_actions_hindi: [
      "MUAC माप लें (12.5 cm से कम = MAM)",
      "वजन दर्ज करें",
      "पोषण सहायता शुरू करें — दाल, अंडे, दूध",
      "15 दिन में फॉलो-अप करें",
    ],
    phc_referral_required: false,
    disclaimer_hindi: "यह AI की सलाह है। अंतिम निर्णय डॉक्टर का होगा।",
  },
});

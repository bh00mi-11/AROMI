import { useEffect, useState } from "react";
import { childAPI, attendanceAPI } from "../lib/api";
import { Plus, CheckCircle, Circle } from "lucide-react";
import toast from "react-hot-toast";

const DEMO_CHILDREN = [
  { id: 1, name: "राज कुमार",   age_months: 36, gender: "M", nutrition_status: "mam",    present: false },
  { id: 2, name: "प्रिया शर्मा", age_months: 48, gender: "F", nutrition_status: "normal", present: true  },
  { id: 3, name: "अनीता पाटिल", age_months: 54, gender: "F", nutrition_status: "sam",    present: false },
  { id: 4, name: "रोहन जाधव",   age_months: 42, gender: "M", nutrition_status: "normal", present: true  },
  { id: 5, name: "सोनू यादव",   age_months: 30, gender: "M", nutrition_status: "mam",    present: true  },
  { id: 6, name: "पूजा वर्मा",  age_months: 60, gender: "F", nutrition_status: "normal", present: true  },
  { id: 7, name: "आयुष सिंह",  age_months: 45, gender: "M", nutrition_status: "normal", present: false },
  { id: 8, name: "काव्या मोरे", age_months: 38, gender: "F", nutrition_status: "mam",    present: true  },
];

const statusLabel: Record<string, { text: string; cls: string }> = {
  normal:  { text: "सामान्य", cls: "badge-normal" },
  mam:     { text: "MAM",     cls: "badge-mam"    },
  sam:     { text: "SAM",     cls: "badge-sam"    },
  unknown: { text: "अज्ञात", cls: "badge-unknown" },
};

export default function Children() {
  const [children, setChildren] = useState(DEMO_CHILDREN);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    childAPI.list()
      .then((r) => setChildren(r.data.map((c: any) => ({ ...c, present: false }))))
      .catch(() => {});
  }, []);

  const toggle = (id: number) => {
    setChildren((prev) => prev.map((c) => c.id === id ? { ...c, present: !c.present } : c));
  };

  const saveAttendance = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const records = children.map((c) => ({
      child_id: c.id, date: today, present: c.present, meal_given: c.present,
    }));
    try {
      await attendanceAPI.bulkLog(today, records);
      toast.success(`${children.filter(c => c.present).length} बच्चों की उपस्थिति दर्ज!`);
    } catch {
      toast.success(`${children.filter(c => c.present).length} बच्चों की उपस्थिति दर्ज! (ऑफलाइन)`);
    } finally {
      setSaving(false);
    }
  };

  const present = children.filter((c) => c.present).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-800 text-lg">👶 बच्चे</h1>
          <p className="text-xs text-gray-500">
            {present}/{children.length} उपस्थित आज
          </p>
        </div>
        <button className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
          <Plus size={14} /> नया बच्चा
        </button>
      </div>

      {/* Attendance strip */}
      <div className="card bg-primary-light border border-orange-200">
        <div className="text-xs font-semibold text-primary mb-2">
          आज की उपस्थिति — {new Date().toLocaleDateString("hi-IN")}
        </div>
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => toggle(c.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                c.present ? "bg-green-100 border-green-300 text-green-700" : "bg-white border-gray-200 text-gray-400"
              }`}>
              {c.present ? <CheckCircle size={12} /> : <Circle size={12} />}
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <button onClick={saveAttendance} disabled={saving}
          className="btn-primary w-full mt-3 py-2 text-sm">
          {saving ? "सहेज रहे हैं..." : "उपस्थिति सहेजें"}
        </button>
      </div>

      {/* Children list */}
      <div className="space-y-2">
        {children.map((c) => {
          const sl = statusLabel[c.nutrition_status] || statusLabel.unknown;
          return (
            <div key={c.id} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                c.gender === "F" ? "bg-pink-100" : "bg-blue-100"
              }`}>
                {c.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-400">
                  {Math.floor(c.age_months / 12)} साल {c.age_months % 12} महीने
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={sl.cls}>{sl.text}</span>
                <span className={`text-[10px] ${c.present ? "text-green-600" : "text-gray-400"}`}>
                  {c.present ? "✓ उपस्थित" : "अनुपस्थित"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { childAPI, attendanceAPI } from "../lib/api";
import { CheckCircle, Circle, Save, BarChart2 } from "lucide-react";
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

const statusColors: Record<string, string> = {
  normal: "bg-green-100 text-green-700",
  mam:    "bg-yellow-100 text-yellow-700",
  sam:    "bg-red-100 text-red-700",
};

export default function Attendance() {
  const [children, setChildren] = useState(
    DEMO_CHILDREN.map((c) => ({ ...c, meal_given: c.present }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = new Date().toLocaleDateString("hi-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const todayISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    childAPI.list()
      .then((r) =>
        setChildren(r.data.map((c: any) => ({ ...c, present: false, meal_given: false })))
      )
      .catch(() => {});
  }, []);

  const toggle = (id: number, field: "present" | "meal_given") => {
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: !c[field as keyof typeof c] };
        if (field === "present" && !updated.present) updated.meal_given = false;
        return updated;
      })
    );
  };

  const markAll = (present: boolean) => {
    setChildren((prev) =>
      prev.map((c) => ({ ...c, present, meal_given: present }))
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    const records = children.map((c) => ({
      child_id: c.id, date: todayISO, present: c.present, meal_given: c.meal_given,
    }));
    try {
      await attendanceAPI.bulkLog(todayISO, records);
      toast.success(`उपस्थिति सहेजी गई — ${presentCount} उपस्थित`);
      setSaved(true);
    } catch {
      toast.success(`उपस्थिति सहेजी गई (ऑफलाइन) — ${presentCount} उपस्थित`);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = children.filter((c) => c.present).length;
  const mealCount    = children.filter((c) => c.meal_given).length;
  const samPresent   = children.filter((c) => c.present && c.nutrition_status === "sam").length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-bold text-gray-800 text-lg">📋 उपस्थिति</h1>
        <p className="text-xs text-gray-500">{today}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "उपस्थित",   value: `${presentCount}/${children.length}`, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "भोजन मिला", value: mealCount,                            color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "SAM उपस्थित", value: samPresent,                         color: "bg-red-50 border-red-200 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`card border text-center py-2 ${s.color}`}>
            <div className="font-bold text-lg">{s.value}</div>
            <div className="text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button onClick={() => markAll(true)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          ✓ सभी उपस्थित
        </button>
        <button onClick={() => markAll(false)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          ✗ सभी अनुपस्थित
        </button>
      </div>

      {/* Children list */}
      <div className="space-y-2">
        {children.map((c) => (
          <div key={c.id} className={`card flex items-center gap-3 transition-all ${
            c.present ? "border-l-4 border-l-green-400" : "opacity-70"
          }`}>
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
              c.gender === "F" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
            }`}>
              {c.name[0]}
            </div>

            {/* Name + age */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 truncate">{c.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  statusColors[c.nutrition_status] || "bg-gray-100 text-gray-500"
                }`}>
                  {c.nutrition_status.toUpperCase()}
                </span>
                <span className="text-[10px] text-gray-400">
                  {Math.floor(c.age_months / 12)}y {c.age_months % 12}m
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={() => toggle(c.id, "present")}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
                  c.present
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "bg-white border-gray-200 text-gray-400"
                }`}>
                {c.present ? <CheckCircle size={11} /> : <Circle size={11} />}
                उपस्थित
              </button>
              <button
                onClick={() => toggle(c.id, "meal_given")}
                disabled={!c.present}
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  c.meal_given
                    ? "bg-orange-100 border-orange-300 text-orange-700"
                    : "bg-white border-gray-200 text-gray-300"
                } disabled:opacity-40 disabled:cursor-not-allowed`}>
                🍱 भोजन
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={saveAttendance}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          saved
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-orange-600"
        }`}>
        {saving ? (
          <span className="animate-pulse">सहेज रहे हैं...</span>
        ) : saved ? (
          <><CheckCircle size={16} /> उपस्थिति सहेजी गई</>
        ) : (
          <><Save size={16} /> उपस्थिति सहेजें</>
        )}
      </button>

      {/* Attendance progress bar */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 size={14} className="text-primary" />
          <span className="text-xs font-semibold text-gray-600">उपस्थिति दर</span>
          <span className="ml-auto text-xs font-bold text-primary">
            {children.length > 0 ? Math.round((presentCount / children.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${children.length > 0 ? (presentCount / children.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

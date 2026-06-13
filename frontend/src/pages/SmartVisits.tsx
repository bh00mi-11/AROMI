import { useEffect, useState } from "react";
import { visitsAPI, childAPI } from "../lib/api";
import { MapPin, Clock, CheckCircle, Plus, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

type Priority = "high" | "medium" | "low";

interface Visit {
  id: number;
  child_name: string;
  child_status: "sam" | "mam" | "normal";
  address: string;
  due_date: string;
  priority: Priority;
  completed: boolean;
  notes: string;
}

const DEMO_VISITS: Visit[] = [
  {
    id: 1, child_name: "अनीता पाटिल", child_status: "sam",
    address: "वार्ड 3, मकान नं 12, पास मंदिर",
    due_date: new Date().toISOString().split("T")[0],
    priority: "high", completed: false,
    notes: "SAM केस — तुरंत गृह भेंट आवश्यक। माँ से पोषण पर बात करें।",
  },
  {
    id: 2, child_name: "राज कुमार", child_status: "mam",
    address: "वार्ड 1, गली नं 4",
    due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    priority: "medium", completed: false,
    notes: "MAM फॉलो-अप — वजन चेक करें।",
  },
  {
    id: 3, child_name: "सोनू यादव", child_status: "mam",
    address: "वार्ड 2, मकान नं 7",
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    priority: "medium", completed: false,
    notes: "नियमित फॉलो-अप।",
  },
  {
    id: 4, child_name: "काव्या मोरे", child_status: "normal",
    address: "वार्ड 4, नई कॉलोनी",
    due_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    priority: "low", completed: true,
    notes: "टीकाकरण जांच पूर्ण।",
  },
];

const priorityConfig: Record<Priority, { label: string; cls: string; border: string }> = {
  high:   { label: "उच्च",   cls: "bg-red-100 text-red-700",    border: "border-l-red-500"    },
  medium: { label: "मध्यम",  cls: "bg-yellow-100 text-yellow-700", border: "border-l-yellow-400" },
  low:    { label: "सामान्य", cls: "bg-green-100 text-green-700", border: "border-l-green-400" },
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  sam:    { label: "SAM",     cls: "bg-red-100 text-red-700"    },
  mam:    { label: "MAM",     cls: "bg-yellow-100 text-yellow-700" },
  normal: { label: "सामान्य", cls: "bg-green-100 text-green-700" },
};

function formatDate(iso: string) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  if (iso === today) return "आज";
  if (iso === tomorrow) return "कल";
  return new Date(iso).toLocaleDateString("hi-IN", { day: "numeric", month: "short" });
}

function isOverdue(iso: string) {
  return iso < new Date().toISOString().split("T")[0];
}

export default function SmartVisits() {
  const [visits, setVisits] = useState<Visit[]>(DEMO_VISITS);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [showForm, setShowForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    visitsAPI.list()
      .then((r) => {
        if (r.data && r.data.length > 0) setVisits(r.data);
      })
      .catch(() => {});
  }, []);

  const markDone = async (id: number) => {
    setVisits((prev) =>
      prev.map((v) => v.id === id ? { ...v, completed: true } : v)
    );
    toast.success("गृह भेंट पूर्ण चिह्नित की गई ✓");
    try {
      await visitsAPI.create({ id, completed: true });
    } catch {}
  };

  const addVisit = async () => {
    if (!newChildName.trim() || !newAddress.trim()) {
      toast.error("बच्चे का नाम और पता आवश्यक है");
      return;
    }
    setAdding(true);
    const newVisit: Visit = {
      id: Date.now(),
      child_name: newChildName,
      child_status: "normal",
      address: newAddress,
      due_date: new Date().toISOString().split("T")[0],
      priority: "low",
      completed: false,
      notes: newNotes,
    };
    try {
      await visitsAPI.create(newVisit);
    } catch {}
    setVisits((prev) => [newVisit, ...prev]);
    setNewChildName(""); setNewAddress(""); setNewNotes("");
    setShowForm(false);
    setAdding(false);
    toast.success("नई गृह भेंट जोड़ी गई");
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-800 text-lg">🏠 स्मार्ट गृह भेंट</h1>
          <p className="text-xs text-gray-500">SAM/MAM बच्चों की प्राथमिकता सूची</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
          <Plus size={14} /> नई भेंट
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "बाकी",     value: pendingCount,   color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "अत्यावश्यक", value: overdueCount,   color: "bg-red-50 border-red-200 text-red-700"    },
          { label: "SAM",      value: samCount,        color: "bg-red-50 border-red-200 text-red-700"    },
          { label: "पूर्ण",    value: completedCount,  color: "bg-green-50 border-green-200 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`card border text-center py-2 px-1 ${s.color}`}>
            <div className="font-bold text-base">{s.value}</div>
            <div className="text-[9px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add visit form */}
      {showForm && (
        <div className="card border border-primary/30 space-y-3">
          <div className="text-sm font-semibold text-gray-700">नई गृह भेंट जोड़ें</div>
          <input
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="बच्चे का नाम"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="पता / वार्ड नंबर"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="नोट्स (वैकल्पिक)"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <button onClick={addVisit} disabled={adding}
              className="flex-1 btn-primary py-2 text-sm">
              {adding ? "जोड़ रहे हैं..." : "जोड़ें"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600">
              रद्द करें
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-white text-primary shadow-sm" : "text-gray-500"
            }`}>
            {f === "pending" ? "बाकी" : f === "completed" ? "पूर्ण" : "सभी"}
          </button>
        ))}
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && filter !== "completed" && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-semibold">
            {overdueCount} गृह भेंट अत्यावश्यक — तुरंत जाएं
          </span>
        </div>
      )}

      {/* Visit cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {filter === "completed" ? "कोई पूर्ण भेंट नहीं" : "सभी भेंट पूर्ण हो गई हैं 🎉"}
          </div>
        )}
        {filtered.map((v) => {
          const pc = priorityConfig[v.priority];
          const sc = statusConfig[v.child_status] || statusConfig.normal;
          const overdue = !v.completed && isOverdue(v.due_date);
          return (
            <div key={v.id} className={`card border-l-4 ${pc.border} ${v.completed ? "opacity-60" : ""}`}>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{v.child_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${sc.cls}`}>
                      {sc.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${pc.cls}`}>
                      {pc.label}
                    </span>
                    {overdue && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                        ⚠️ विलंबित
                      </span>
                    )}
                  </div>
                </div>
                {v.completed && (
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Address */}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <MapPin size={11} className="shrink-0" />
                <span>{v.address}</span>
              </div>

              {/* Due date */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <Clock size={11} className="shrink-0" />
                <span className={overdue ? "text-red-600 font-semibold" : ""}>
                  {overdue ? "अत्यावश्यक — " : "तारीख: "}{formatDate(v.due_date)}
                </span>
              </div>

              {/* Notes */}
              {v.notes && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                  {v.notes}
                </div>
              )}

              {/* Mark done button */}
              {!v.completed && (
                <button
                  onClick={() => markDone(v.id)}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-orange-600 transition-all flex items-center justify-center gap-1.5">
                  <CheckCircle size={13} />
                  गृह भेंट पूर्ण करें
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

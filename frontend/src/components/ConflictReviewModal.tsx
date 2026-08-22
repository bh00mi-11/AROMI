import { useState } from "react";
import {
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import { ClinicalConflict } from "../lib/conflictEngine";

interface ConflictReviewModalProps {
  conflicts: ClinicalConflict[];
  onConfirm: (overrideJustification?: string) => void;
  onClose: () => void;
}

export default function ConflictReviewModal({
  conflicts,
  onConfirm,
  onClose,
}: ConflictReviewModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [justification, setJustification] = useState("");

  if (!conflicts || conflicts.length === 0) return null;

  const primaryConflict = conflicts[0];

  const handleConfirm = () => {
    if (!acknowledged) return;
    onConfirm(justification.trim() || undefined);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl max-w-lg w-full overflow-hidden text-text-main">
        {/* Modal Top Bar */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div>
              <h2 id="conflict-modal-title" className="text-sm md:text-base font-bold leading-snug">
                समीक्षा उपरांत पुष्टि आवश्यक (Review Before Confirmation)
              </h2>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                डेटा विसंगति संसूचक (AROMI Clinical Conflict Engine)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="बंद करें"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Conflict Alert Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs md:text-sm font-bold text-amber-950">
                  {primaryConflict.titleHi}
                </h3>
                <p className="text-xs font-semibold text-amber-900 mt-0.5">
                  {primaryConflict.titleEn}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed pt-1 font-medium">
              {primaryConflict.descriptionHi}
            </p>
          </div>

          {/* Structured Discrepancy Comparison Table */}
          <div className="border border-border-subtle rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-bg-base px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                तुलनात्मक विश्लेषण (Comparative Indicators)
              </span>
              <span className="text-xs font-bold text-slate-600">
                लाभार्थी: {primaryConflict.childName}
              </span>
            </div>

            <div className="divide-y divide-border-subtle text-xs">
              <div className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  {primaryConflict.discrepancyDetails.indicatorA}
                </span>
                <span className="font-bold text-text-main sm:text-right">
                  {primaryConflict.discrepancyDetails.valueA}
                </span>
              </div>

              <div className="p-3 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  {primaryConflict.discrepancyDetails.indicatorB}
                </span>
                <span className="font-bold text-amber-950 sm:text-right">
                  {primaryConflict.discrepancyDetails.valueB}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <FileCheck size={15} className="text-blue-700" />
              <span>प्रशासनिक संस्तुति (Recommended Action)</span>
            </div>
            <p className="text-xs leading-relaxed text-blue-950 font-medium">
              {primaryConflict.recommendedActionHi}
            </p>
          </div>

          {/* User Acknowledgment Checkbox (Mandatory Commit Gate) */}
          <div className="bg-bg-base/70 rounded-xl p-4 border border-border-subtle space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-text-main block">
                  माप पुनः जाँचा गया एवं सत्य पाया गया (Measurement Rechecked ✓)
                </span>
                <span className="text-xs text-slate-600 leading-snug block mt-0.5 font-medium">
                  मैंने सभी शारीरिक मापों व पूर्व प्रविष्टियों की पुनः भौतिक जाँच कर ली है तथा इस प्रविष्टि को अधिकृत करता/करती हूँ।
                </span>
              </div>
            </label>

            {/* Optional Justification Note */}
            {acknowledged && (
              <div className="pt-2 border-t border-border-subtle animate-fade-in">
                <label className="block text-xs font-bold text-text-main mb-1">
                  पुष्टिकरण / स्पष्टीकरण टिप्पणी (Verification Note — Optional)
                </label>
                <input
                  type="text"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="उदा. स्केल पुनः कैलिब्रेट किया गया / बच्चे के वजन में तीव्र सुधार दर्ज"
                  className="input-gov"
                  aria-label="पुष्टिकरण या स्पष्टीकरण टिप्पणी"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4.5 bg-bg-base border-t border-border-subtle flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5 font-semibold text-slate-700 flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gov-blue"
          >
            <ArrowLeft size={14} />
            <span>विवरण पुनः संपादित करें (Go Back & Edit)</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!acknowledged}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-600 ${
              acknowledged
                ? "bg-amber-600 hover:bg-amber-700 text-white active:scale-95 cursor-pointer"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>समीक्षा उपरांत पुष्टि व सुरक्षित करें (Confirm & Save)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

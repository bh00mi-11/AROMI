import React, { useState } from "react";
import {
  AlertTriangle, CheckCircle2, AlertCircle, ArrowLeft,
  Check, X, ShieldAlert, Scale, HelpCircle, FileCheck
} from "lucide-react";
import { ConflictItem } from "../lib/conflictEngine";

interface ConflictReviewModalProps {
  isOpen: boolean;
  conflicts: ConflictItem[];
  onClose: () => void;
  onConfirm: (justificationNote?: string) => void;
}

export default function ConflictReviewModal({
  isOpen,
  conflicts,
  onClose,
  onConfirm,
}: ConflictReviewModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [justification, setJustification] = useState("");

  if (!isOpen || conflicts.length === 0) return null;

  // Primary active conflict
  const primaryConflict = conflicts[0];

  const handleConfirm = () => {
    if (!acknowledged) return;
    onConfirm(justification);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Government Security / Verification Banner */}
        <div className="bg-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold leading-snug">
                समीक्षा उपरांत पुष्टि आवश्यक (Review Before Confirmation)
              </h2>
              <p className="text-[11px] text-amber-100 mt-0.5">
                डेटा विसंगति संसूचक (AROMI Clinical Conflict Engine)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="बंद करें"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4.5">
          {/* Conflict Alert Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs md:text-sm font-bold text-amber-900">
                  {primaryConflict.titleHi}
                </h3>
                <p className="text-[11px] font-medium text-amber-800 mt-0.5">
                  {primaryConflict.titleEn}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed pt-1">
              {primaryConflict.descriptionHi}
            </p>
          </div>

          {/* Structured Discrepancy Comparison Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-gray-100/90 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                तुलनात्मक विश्लेषण (Comparative Indicators)
              </span>
              <span className="text-[10px] font-semibold text-gray-500">
                लाभार्थी: {primaryConflict.childName}
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="p-3 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {primaryConflict.discrepancyDetails.indicatorA}
                </span>
                <span className="font-bold text-gray-900 sm:text-right">
                  {primaryConflict.discrepancyDetails.valueA}
                </span>
              </div>

              <div className="p-3 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {primaryConflict.discrepancyDetails.indicatorB}
                </span>
                <span className="font-bold text-amber-950 sm:text-right">
                  {primaryConflict.discrepancyDetails.valueB}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
            <div className="font-bold text-[11px] uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <FileCheck size={14} className="text-blue-600" />
              <span>प्रशासनिक संस्तुति (Recommended Action)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-950">
              {primaryConflict.recommendedActionHi}
            </p>
          </div>

          {/* User Acknowledgment Checkbox (Mandatory Commit Gate) */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">
                  माप पुनः जाँचा गया एवं सत्य पाया गया (Measurement Rechecked ✓)
                </span>
                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                  मैंने सभी शारीरिक मापों व पूर्व प्रविष्टियों की पुनः भौतिक जाँच कर ली है तथा इस प्रविष्टि को अधिकृत करता/करती हूँ।
                </span>
              </div>
            </label>

            {/* Optional Justification Note */}
            {acknowledged && (
              <div className="pt-2 border-t border-gray-200/80 animate-fade-in">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  पुष्टिकरण / स्पष्टीकरण टिप्पणी (Verification Note — Optional)
                </label>
                <input
                  type="text"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="उदा. स्केल पुनः कैलिब्रेट किया गया / बच्चे के वजन में तीव्र सुधार दर्ज"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>विवरण पुनः संपादित करें (Go Back & Edit)</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!acknowledged}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
              acknowledged
                ? "bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

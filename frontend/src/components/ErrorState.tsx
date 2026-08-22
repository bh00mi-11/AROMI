import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorState({
  title = "⚠ रिकॉर्ड लोड करने में असमर्थ",
  message = "डेटा लोड करते समय समस्या आई। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।",
  onRetry,
  retryLabel = "पुनः प्रयास करें (Retry)",
}: ErrorStateProps) {
  return (
    <div role="alert" className="w-full bg-white border border-red-200 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-danger-red mb-3">
        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
      </div>

      <h3 className="text-base font-bold text-text-main mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-slate-600 max-w-md mb-5 leading-relaxed font-medium">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}

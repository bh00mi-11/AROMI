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
    <div className="w-full bg-white border border-red-200/80 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xs transition-opacity duration-200 ease-out">
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-inner">
        <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-gray-500 max-w-md mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}

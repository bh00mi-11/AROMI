import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  type?: "table" | "card" | "spinner";
  rows?: number;
}

export default function LoadingState({
  message = "डेटा लोड हो रहा है...",
  submessage = "कृपया प्रतीक्षा करें, रिकॉर्ड लोड किए जा रहे हैं...",
  type = "card",
  rows = 4,
}: LoadingStateProps) {
  if (type === "spinner") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 transition-opacity duration-200 ease-out">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">{message}</p>
        {submessage && <p className="text-xs text-gray-400 mt-1">{submessage}</p>}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 transition-opacity duration-200 ease-out">
      {/* Top micro progress banner */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span className="text-xs font-medium text-gray-600">{message}</span>
        </div>
        <span className="text-[11px] text-gray-400 animate-pulse">ICDS डेटा सिंक...</span>
      </div>

      {/* Skeleton cards */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs animate-pulse"
          >
            {/* Avatar skeleton */}
            <div className="w-10 h-10 rounded-full bg-gray-200/80 shrink-0" />

            {/* Middle text skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div
                className="h-3.5 bg-gray-200/90 rounded-md"
                style={{ width: `${60 + (idx % 3) * 15}%` }}
              />
              <div
                className="h-2.5 bg-gray-100 rounded-md"
                style={{ width: `${35 + (idx % 2) * 20}%` }}
              />
            </div>

            {/* Status badge skeleton */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="w-16 h-5 bg-gray-200/80 rounded-full" />
              <div className="w-12 h-2.5 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

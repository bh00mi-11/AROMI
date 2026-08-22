import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "कोई रिकॉर्ड नहीं मिला",
  message = "वर्तमान में कोई रिकॉर्ड उपलब्ध नहीं है या आपके द्वारा चुने गए फ़िल्टर से कोई मिलान नहीं हुआ।",
  actionLabel = "फ़िल्टर साफ़ करें (Clear Filters)",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-white border border-dashed border-gray-300 rounded-xl p-8 md:p-10 flex flex-col items-center justify-center text-center shadow-2xs transition-opacity duration-200 ease-out">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>

      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300/80 transition-all duration-150"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

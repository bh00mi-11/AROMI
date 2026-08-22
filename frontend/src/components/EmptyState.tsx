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
  title = "कोई रिकॉर्ड नहीं मिला (No Records Found)",
  message = "चयनित फ़िल्टर अथवा खोज मापदंड के अनुसार कोई प्रविष्टि उपलब्ध नहीं है।",
  actionLabel = "फ़िल्टर साफ़ करें (Clear Filters)",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-white border border-dashed border-border-subtle rounded-xl p-8 md:p-10 flex flex-col items-center justify-center text-center shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-bg-base border border-border-subtle flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-base font-bold text-text-main mb-1">{title}</h3>
      <p className="text-xs md:text-sm text-slate-600 max-w-sm mb-5 leading-relaxed font-medium">
        {message}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-secondary text-xs px-4 py-2"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

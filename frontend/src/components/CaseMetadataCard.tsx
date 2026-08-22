import React from "react";
import StatusBadge, { NutritionOrCaseStatus } from "./StatusBadge";
import { Shield, Calendar, UserCheck, AlertCircle, Clock } from "lucide-react";

interface CaseMetadataCardProps {
  id: number | string;
  name: string;
  ageMonths?: number;
  gender?: string;
  status: NutritionOrCaseStatus;
  dateReported?: Date | string;
  officerName?: string;
  centreName?: string;
  urgencyLevel?: string;
}

export function formatCaseId(id: number | string, year = 2026): string {
  const num = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, ""), 10) || 1;
  return `AROMI-${year}-${String(num).padStart(5, "0")}`;
}

export function formatDate(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "22 Aug 2026";
  }
}

export function formatTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "10:42 AM";
  }
}

export default function CaseMetadataCard({
  id,
  name,
  ageMonths,
  gender,
  status,
  dateReported = new Date(),
  officerName,
  centreName,
  urgencyLevel,
}: CaseMetadataCardProps) {
  const caseIdFormatted = formatCaseId(id);
  const dateFormatted = formatDate(dateReported);
  const timeFormatted = formatTime(dateReported);

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-5 md:p-6 shadow-2xs space-y-4 select-none">
      {/* Top Reference Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-bg-base text-text-main font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-border-subtle">
            <Shield size={14} className="text-primary-navy" />
            <span>Case #{caseIdFormatted}</span>
          </div>
          <StatusBadge status={status} size="sm" />
          {urgencyLevel && (
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
              {urgencyLevel}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-600 font-medium">
          प्रशासनिक पंजीयन संदर्भ • ICDS-MH-PUN-2026
        </div>
      </div>

      {/* 4 Metadata Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Beneficiary */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            लाभार्थी (Beneficiary)
          </div>
          <div className="font-bold text-text-main text-sm truncate">{name}</div>
          <div className="text-xs text-slate-600 font-medium">
            {ageMonths ? `${Math.floor(ageMonths / 12)} वर्ष ${ageMonths % 12} माह` : "उम्र उपलब्ध"}
            {gender && ` • ${gender === "F" ? "बालिका" : "बालक"}`}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <Calendar size={12} />
            <span>रिपोर्टिंग तिथि (Date)</span>
          </div>
          <div className="font-bold text-text-main">{dateFormatted}</div>
          <div className="text-xs text-slate-600 flex items-center gap-1">
            <Clock size={11} />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Assigned Officer */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <UserCheck size={12} />
            <span>अधिकृत अधिकारी (Officer)</span>
          </div>
          <div className="font-bold text-text-main truncate">
            {officerName || "श्रीमती प्रिया शर्मा"}
          </div>
          <div className="text-xs text-slate-600 truncate">
            {centreName || "आंगनवाड़ी केंद्र 14"}
          </div>
        </div>

        {/* Followup & Action Status */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <AlertCircle size={12} />
            <span>समीक्षा स्थिति (Review)</span>
          </div>
          <div className="font-bold text-text-main">
            {status === "sam"
              ? "🔴 तत्काल PHC रेफरल"
              : status === "mam"
              ? "🟠 पूरक आहार निगरानी"
              : "🟢 सामान्य स्वस्थ विकास"}
          </div>
          <div className="text-xs text-slate-600 font-medium">सत्यापन: सक्रिय</div>
        </div>
      </div>
    </div>
  );
}

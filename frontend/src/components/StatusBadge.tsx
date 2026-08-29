import React from "react";

export type NutritionOrCaseStatus =
  | "normal"
  | "mam"
  | "sam"
  | "active"
  | "pending"
  | "resolved"
  | "urgent"
  | "unknown"
  | string;

interface StatusBadgeProps {
  status: NutritionOrCaseStatus;
  customLabel?: string;
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  customLabel,
  size = "sm",
}: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();

  let config = {
    label: customLabel || "अज्ञात (Unknown)",
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-600",
  };

  if (normalized === "normal" || normalized === "resolved" || normalized === "closed" || normalized === "सामान्य") {
    config = {
      label: customLabel || "सामान्य (Normal)",
      bg: "bg-green-50",
      text: "text-green-800",
      border: "border-green-200",
      dot: "bg-green-600",
    };
  } else if (normalized === "mam" || normalized === "pending" || normalized === "under review" || normalized === "मध्यम") {
    config = {
      label: customLabel || "MAM (Under Review)",
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      dot: "bg-amber-600",
    };
  } else if (normalized === "sam" || normalized === "urgent" || normalized === "danger" || normalized === "critical" || normalized === "गंभीर") {
    config = {
      label: customLabel || "SAM (Critical / Urgent)",
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-200",
      dot: "bg-red-600",
    };
  } else if (normalized === "active" || normalized === "open" || normalized === "सक्रिय") {
    config = {
      label: customLabel || "सक्रिय (Active)",
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
      dot: "bg-blue-600",
    };
  } else if (normalized === "info" || normalized === "verified" || normalized === "guideline" || normalized === "प्रमाणित") {
    config = {
      label: customLabel || "सत्यापित मार्गदर्शक (Official Guideline)",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      dot: "bg-emerald-600",
    };
  } else if (normalized === "warning" || normalized === "out_of_domain" || normalized === "unbacked" || normalized === "अपुष्ट") {
    config = {
      label: customLabel || "अधिकृत आधार उपलब्ध नाही (Out of Domain)",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      dot: "bg-amber-600",
    };
  } else if (normalized === "conflict" || normalized === "तफावत") {
    config = {
      label: customLabel || "तफावत (Data Conflict)",
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-200",
      dot: "bg-purple-600",
    };
  } else if (normalized === "error" || normalized === "failed" || normalized === "त्रुटी") {
    config = {
      label: customLabel || "त्रुटी (Error)",
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-200",
      dot: "bg-red-600",
    };
  }

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2.5 py-0.5"
      : "text-xs px-3 py-1 font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-2xs whitespace-nowrap select-none ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}

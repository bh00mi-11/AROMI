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
    bg: "bg-bg-base",
    text: "text-gray-600",
    border: "border-border-subtle",
    dot: "bg-gray-400",
  };

  if (normalized === "normal" || normalized === "resolved" || normalized === "closed" || normalized === "सामान्य") {
    config = {
      label: customLabel || "सामान्य (Normal)",
      bg: "bg-green-50",
      text: "text-success-green",
      border: "border-green-200",
      dot: "bg-success-green",
    };
  } else if (normalized === "mam" || normalized === "pending" || normalized === "under review" || normalized === "मध्यम") {
    config = {
      label: customLabel || "MAM (Under Review)",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      dot: "bg-warning-amber",
    };
  } else if (normalized === "sam" || normalized === "urgent" || normalized === "danger" || normalized === "critical" || normalized === "गंभीर") {
    config = {
      label: customLabel || "SAM (Critical / Urgent)",
      bg: "bg-red-50",
      text: "text-danger-red",
      border: "border-red-200",
      dot: "bg-danger-red",
    };
  } else if (normalized === "active" || normalized === "open" || normalized === "सक्रिय") {
    config = {
      label: customLabel || "सक्रिय (Active)",
      bg: "bg-blue-50",
      text: "text-gov-blue",
      border: "border-blue-200",
      dot: "bg-gov-blue",
    };
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : "text-xs px-2.5 py-1 font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border shadow-2xs whitespace-nowrap select-none ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}

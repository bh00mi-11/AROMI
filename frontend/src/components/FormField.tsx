import React, { ReactNode } from "react";
import { AlertCircle, HelpCircle, LucideIcon } from "lucide-react";

export interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string | null;
  id?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  required = false,
  helperText,
  error,
  id,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-text-main tracking-tight"
      >
        <span>{label}</span>
        {required && (
          <span className="text-danger-red font-black ml-1" title="अनिवार्य (Required)">
            *
          </span>
        )}
      </label>

      <div className="relative">{children}</div>

      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger-red flex items-center gap-1 mt-1">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
          <HelpCircle size={12} className="shrink-0 text-slate-500" />
          <span>{helperText}</span>
        </p>
      ) : null}
    </div>
  );
}

export interface FormSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  subtitle,
  description,
  icon: Icon,
  children,
  className = "",
}: FormSectionProps) {
  const sub = subtitle || description;
  return (
    <div className={`space-y-4 pt-5 first:pt-0 ${className}`}>
      <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} className="text-primary-navy shrink-0" />}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
              {title}
            </h3>
            {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
          </div>
        </div>
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

export default FormField;

import React from "react";
import { cn } from "../../utils/cn";

interface SelectProps {
  label?: string;
  defaultValue?: string;
  options: string[];
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Labeled dropdown ("Label: value ▾"). Shared primitive for the Marketplace
 * filter facets (Type / Software / License / Price) and the Sort control.
 * Uncontrolled (defaultValue) — pass `onChange` to react to selection.
 */
export const Select: React.FC<SelectProps> = ({ label, defaultValue, options, onChange, className }) => (
  <label className={cn(
    "flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/20 text-sm font-jetbrains text-on-surface-variant",
    className
  )}>
    {label && <span className="text-on-surface-variant/70 shrink-0">{label}:</span>}
    <select
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      className="bg-transparent outline-none text-on-surface font-semibold cursor-pointer w-full"
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-surface-container text-on-surface">
          {opt}
        </option>
      ))}
    </select>
  </label>
);

export default Select;

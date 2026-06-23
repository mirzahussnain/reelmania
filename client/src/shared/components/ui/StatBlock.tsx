import React from "react";
import { cn } from "../../utils/cn";

type StatTone = "default" | "primary" | "secondary";

const TONE: Record<StatTone, string> = {
  default: "",
  primary: "text-primary",
  secondary: "text-secondary",
};

interface StatBlockProps {
  value: React.ReactNode;
  label: string;
  onClick?: () => void;
  /** Accent colour for the value. */
  tone?: StatTone;
  /** Deprecated alias for tone="primary". */
  highlight?: boolean;
  align?: "center" | "start";
  className?: string;
}

// Profile/Vault stat: a large value over a small uppercase label.
export const StatBlock: React.FC<StatBlockProps> = ({
  value,
  label,
  onClick,
  tone = "default",
  highlight = false,
  align = "start",
  className,
}) => {
  const interactive = Boolean(onClick);
  const resolvedTone: StatTone = highlight ? "primary" : tone;
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center" : "items-center md:items-start",
        interactive && "cursor-pointer hover:text-primary transition-colors group",
        className
      )}
    >
      <span className={cn("stat-value", TONE[resolvedTone])}>{value}</span>
      <span className="label-meta mt-1">{label}</span>
    </div>
  );
};

export default StatBlock;

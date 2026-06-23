import React from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  /** Primary message. */
  message: string;
  /** Optional secondary line. */
  hint?: string;
  /** Optional leading icon/illustration. */
  icon?: React.ReactNode;
  /** Optional call-to-action (e.g. a Button). */
  action?: React.ReactNode;
  className?: string;
}

// Consistent "nothing here" panel used by feeds, grids and lists.
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  hint,
  icon,
  action,
  className,
}) => (
  <div
    className={cn(
      "w-full flex flex-col items-center justify-center text-center py-20 gap-3",
      className
    )}
  >
    {icon && <div className="text-on-surface-variant/60 text-4xl">{icon}</div>}
    <p className="text-on-surface-variant font-mono text-sm">{message}</p>
    {hint && <p className="text-on-surface-variant/60 text-xs">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;

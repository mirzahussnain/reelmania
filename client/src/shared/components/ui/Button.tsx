import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "pill" | "icon" | "unstyled";
type ButtonSize = "sm" | "md" | "lg";

// Variants map to the semantic-token utilities already defined in index.css,
// so the primitive is the single place button styling lives. `pill` pairs with
// the `active` prop (pill-active / pill-inactive) for tab/filter-style toggles.
// `icon` is the circular video-overlay button. `unstyled` is an escape hatch
// for bespoke buttons: it applies no base styling so the existing markup is
// preserved exactly while still routing through the single primitive.
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary font-semibold hover:bg-primary-container hover:glow-primary",
  secondary:
    "bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high",
  ghost:
    "text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-high",
  pill: "pill-btn",
  icon: "action-circle",
  unstyled: "",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "py-1.5 px-4 text-sm",
  md: "py-2 px-6 text-sm",
  lg: "py-2.5 px-8 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** Only meaningful for the `pill` variant (toggle/tab state). */
  active?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      active = false,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    // `unstyled` preserves bespoke markup verbatim — only the caller's classes.
    if (variant === "unstyled") {
      return (
        <button
          ref={ref}
          type={type}
          disabled={disabled || loading}
          className={cn(className)}
          {...props}
        >
          {children}
        </button>
      );
    }

    // `icon`/`pill` carry their own shape, padding and sizing.
    const usesOwnLayout = variant === "icon" || variant === "pill";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          !usesOwnLayout &&
            "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANT[variant],
          variant === "pill" && (active ? "pill-active" : "pill-inactive"),
          !usesOwnLayout && SIZE[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <span
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

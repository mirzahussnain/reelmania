import React from "react";
import { cn } from "../../utils/cn";
import { BADGE_ASSETS, type BadgeItem } from "../../constants/badges";

interface BadgeProps {
  badge: BadgeItem;
  /** Rendered pixel size (square). Defaults to 28. */
  size?: number;
  className?: string;
}

// Warn at most once per unknown id so a server/client id drift is VISIBLE in
// monitoring (Option 3) without spamming the console on every render.
const warned = new Set<string>();
const warnUnknownBadge = (id: string) => {
  if (warned.has(id)) return;
  warned.add(id);
  // Swap console.warn for the app's telemetry sink when one exists.
  console.warn(`[Badge] Unknown badge id from server: "${id}". Add its asset to BADGE_ASSETS.`);
};

/**
 * Renders a single earned badge. Presentation only — eligibility is decided
 * server-side and delivered in the profile's `badges[]`. If the server emits an
 * id the client has no asset for (id drift / a badge shipped server-first), it
 * degrades to a neutral label chip instead of a broken image, and warns once.
 */
export const Badge: React.FC<BadgeProps> = ({ badge, size = 28, className }) => {
  const src = BADGE_ASSETS[badge.id];

  if (!src) {
    warnUnknownBadge(badge.id);
    return (
      <span
        title={badge.label}
        style={{ height: size }}
        className={cn(
          "inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container px-2 text-[10px] font-jetbrains font-semibold text-on-surface-variant",
          className
        )}
      >
        {badge.label}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={badge.label}
      title={badge.label}
      width={size}
      height={size}
      loading="lazy"
      className={cn("inline-block object-contain drop-shadow-[0_0_6px_rgba(208,188,255,0.35)]", className)}
    />
  );
};

interface BadgeRowProps {
  badges?: BadgeItem[];
  size?: number;
  className?: string;
}

/** A horizontal row of badges; renders nothing when there are none. */
export const BadgeRow: React.FC<BadgeRowProps> = ({ badges, size, className }) => {
  if (!badges || badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {badges.map((b) => (
        <Badge key={b.id} badge={b} size={size} />
      ))}
    </div>
  );
};

export default Badge;

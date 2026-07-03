import React, { useState } from "react";
import { cn } from "../../utils/cn";
import { Sheet } from "./Sheet";
import { Button } from "./Button";
import { BADGE_ASSETS, BADGE_DESCRIPTIONS, type BadgeItem } from "../../constants/badges";

// "verified" is surfaced on the avatar (see Avatar), so it's excluded from the
// badge row to avoid showing it twice.
const ROW_EXCLUDED = new Set<string>(["verified"]);

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

/** Detail modal: scaled-up badge, title, then description. */
export const BadgeModal: React.FC<{ badge: BadgeItem; src?: string; isOpen: boolean; onClose: () => void }> = ({
  badge, src, isOpen, onClose,
}) => (
  <Sheet
    isOpen={isOpen}
    onClose={onClose}
    variant="center"
    className="w-full max-w-xs bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center"
  >
    {src ? (
      <img
        src={src}
        alt={badge.label}
        className="w-32 h-32 object-contain drop-shadow-[0_0_18px_rgba(208,188,255,0.45)]"
      />
    ) : (
      <div className="w-32 h-32 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-sm">
        {badge.label}
      </div>
    )}
    <h3 className="mt-5 text-xl font-syne font-bold text-on-surface">{badge.label}</h3>
    <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
      {BADGE_DESCRIPTIONS[badge.id] ?? "An earned Kinetix badge."}
    </p>
  </Sheet>
);

/**
 * Renders a single earned badge. Presentation only — eligibility is decided
 * server-side and delivered in the profile's `badges[]`. Clicking opens a detail
 * modal (scaled badge + title + description). Unknown ids degrade to a neutral
 * label chip instead of a broken image, and warn once.
 */
export const Badge: React.FC<BadgeProps> = ({ badge, size = 28, className }) => {
  const src = BADGE_ASSETS[badge.id];
  const [open, setOpen] = useState(false);
  if (!src) warnUnknownBadge(badge.id);

  // stop the click from bubbling to an ancestor <Link> (e.g. inside a node card).
  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="unstyled"
        onClick={openModal}
        aria-label={badge.label}
        className="inline-flex items-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {src ? (
          <img
            src={src}
            alt={badge.label}
            title={badge.label}
            width={size}
            height={size}
            loading="lazy"
            className={cn("object-contain drop-shadow-[0_0_6px_rgba(208,188,255,0.35)]", className)}
          />
        ) : (
          <span
            style={{ height: size }}
            className={cn(
              "inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container px-2 text-[10px] font-jetbrains font-semibold text-on-surface-variant",
              className
            )}
          >
            {badge.label}
          </span>
        )}
      </Button>

      <BadgeModal badge={badge} src={src} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

interface BadgeRowProps {
  badges?: BadgeItem[];
  size?: number;
  className?: string;
}

/** A horizontal row of badges; renders nothing when there are none. `verified`
 *  is excluded — it's shown on the avatar instead. */
export const BadgeRow: React.FC<BadgeRowProps> = ({ badges, size, className }) => {
  const visible = badges?.filter((b) => !ROW_EXCLUDED.has(b.id)) ?? [];
  if (visible.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visible.map((b) => (
        <Badge key={b.id} badge={b} size={size} />
      ))}
    </div>
  );
};

export default Badge;

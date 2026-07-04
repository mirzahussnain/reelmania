import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

/**
 * Feed tabs (For You / Following) — the single source of the home-feed switcher,
 * shared by the desktop Topbar and the mobile in-feed overlay.
 *
 * The route path for the network feed stays /following; the label is "Following".
 * The list scrolls horizontally (future-proof for more tabs) and fades at both
 * edges so, on mobile, side tabs blend toward the volume / speed controls that
 * flank it (TikTok-style).
 */
export const FEED_TABS = [
  { label: "For You", to: "/foryou", isActive: (p: string) => p === "/foryou" || p === "/" },
  { label: "Following", to: "/following", isActive: (p: string) => p === "/following" },
];

// Fade both edges so scrolled/side tabs dissolve toward the flanking controls.
const EDGE_FADE: React.CSSProperties = {
  WebkitMaskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
  maskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
};

export const FeedTabs: React.FC<{ variant?: "desktop" | "mobile" }> = ({ variant = "desktop" }) => {
  const location = useLocation();
  const mobile = variant === "mobile";

  return (
    <div
      // Fade + horizontal scroll only on mobile (blends toward the flanking
      // controls, scales to more tabs). Desktop keeps the original plain row.
      style={mobile ? EDGE_FADE : undefined}
      className={cn(
        "flex items-center",
        mobile ? "gap-5 px-6 overflow-x-auto scrollbar-hide max-w-[80vw]" : "gap-8"
      )}
    >
      {FEED_TABS.map((tab) => {
        const active = tab.isActive(location.pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "relative shrink-0 py-2 transition-colors font-inter font-semibold whitespace-nowrap",
              mobile ? "text-[15px] text-on-media drop-shadow-md" : "text-[17px]",
              active
                ? mobile
                  ? "text-on-media"
                  : "text-on-surface"
                : mobile
                  ? "text-on-media/60 hover:text-on-media/90"
                  : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab.label}
            {active && <div className="neon-bar absolute bottom-0 left-0 w-full" />}
          </Link>
        );
      })}
    </div>
  );
};

export default FeedTabs;

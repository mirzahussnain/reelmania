import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { NETWORK } from "../../constants/network";

/**
 * Topbar — only the Home feed tabs (For You / Synced).
 *
 * Account controls (avatar, notifications, settings) now live in the Sidebar.
 * The Topbar only renders on routes with `topbar: true` (currently /foryou and
 * /following — see routes.config.ts); Discover and Marketplace have their own
 * page headers and no top tabs. The route path stays /following; only the
 * user-facing label is rebranded to the Sync vocabulary.
 */
const HOME_TABS = [
  { label: "For You", to: "/foryou", isActive: (p: string) => p === "/foryou" || p === "/" },
  { label: NETWORK.SYNCED, to: "/following", isActive: (p: string) => p === "/following" },
];

export const Topbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="w-full h-20 shrink-0 flex items-center justify-center px-8 z-40 bg-transparent relative pointer-events-auto">
      <div className="flex items-center gap-8 font-inter font-semibold text-[17px]">
        {HOME_TABS.map((tab) => {
          const active = tab.isActive(location.pathname);
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={cn(
                "relative px-1 py-2 transition-colors",
                active ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tab.label}
              {active && <div className="neon-bar absolute bottom-0 left-0 w-full" />}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

import React from "react";
import { FeedTabs } from "./FeedTabs";

/**
 * Topbar — the desktop wrapper around the shared feed-tab switcher (For You /
 * Following). Account controls live in the Sidebar; this only renders on routes
 * with `topbar: true` (see routes.config.ts). On mobile the same FeedTabs render
 * as an in-feed overlay (see Layout).
 */
export const Topbar: React.FC = () => (
  <header className="w-full h-20 shrink-0 flex items-center justify-center px-8 z-40 bg-transparent relative pointer-events-auto">
    <FeedTabs variant="desktop" />
  </header>
);

import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Sidebar } from "../shared/components/layout/Sidebar";
import { Topbar } from "../shared/components/layout/Topbar";
import { MobileFeedTopBar } from "../shared/components/layout/MobileFeedTopBar";
import { CanvasNetworkBackground } from "../shared/components/ui/CanvasNetworkBackground";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { isStandaloneRoute, routeHasTopbar } from "../app/routes.config";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const screenWidth = useScreenWidth();
  const location = useLocation();
  const isMobile = screenWidth <= 1016;

  const isStandalonePage = isStandaloneRoute(location.pathname);

  if (isStandalonePage) {
    // body has `overflow: hidden`, so the wrapper must own the scroll itself —
    // otherwise long standalone pages (public profile/network) get clipped.
    return (
      <div className="w-full h-[100dvh] overflow-y-auto overflow-x-hidden relative bg-background font-inter">
        <CanvasNetworkBackground />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-full h-[100dvh] overflow-hidden relative bg-background flex flex-col">
        <CanvasNetworkBackground />

        {/* In-feed top bar (speed · For You/Following tabs · volume), TikTok-style:
            a single fixed instance over the feed, so controls don't scroll away
            with each video. Feed routes only. */}
        {routeHasTopbar(location.pathname) && <MobileFeedTopBar />}

        {/* Scrollable content area. Full-height feed pages (Home) manage their
            own internal scroll and stay h-full; normal long pages (Discover,
            Marketplace) scroll here. */}
        <div className="flex-1 w-full min-h-0 relative z-10 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <Navbar /> {/* Mobile Navbar at bottom */}
      </div>
    );
  }

  // Desktop Cinematic Layout
  return (
    <div className="flex w-full h-[100dvh] bg-background text-on-background overflow-hidden relative">
      <CanvasNetworkBackground />
      {/* Fixed Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Floating Topbar only on routes that opt in (see routes.config.ts) */}
        {routeHasTopbar(location.pathname) && <Topbar />}

        {/* Page Content */}
        <main className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

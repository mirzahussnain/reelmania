import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Sidebar } from "../shared/components/layout/Sidebar";
import { Topbar } from "../shared/components/layout/Topbar";
import useScreenWidth from "../utils/hooks/useScreenWidth";

interface LayoutProps {
  children: ReactNode; 
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const screenWidth = useScreenWidth();
  const location = useLocation();
  const isMobile = screenWidth <= 1016;

  const isStandalonePage = 
    location.pathname.includes("/sign-in") || 
    location.pathname.includes("/sign-up") || 
    location.pathname.includes("/share/profile");

  if (isStandalonePage) {
    return (
      <div className="w-full h-[100dvh] overflow-hidden relative bg-background">
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-full h-[100dvh] overflow-hidden relative bg-background flex flex-col">
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {children} 
        </div>
        <Navbar /> {/* Mobile Navbar at bottom */}
      </div>
    );
  }

  // Desktop Cinematic Layout
  return (
    <div className="flex w-full h-[100dvh] bg-background text-on-background overflow-hidden relative">
      {/* Fixed Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Floating Topbar only on Home pages */}
        {(location.pathname === '/' || location.pathname === '/foryou') && <Topbar />}

        {/* Page Content */}
        <main className="flex-1 w-full h-full relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

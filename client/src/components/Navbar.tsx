import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { FiMoreHorizontal } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { BiSolidCompass, BiSolidStore } from "react-icons/bi";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";

import { MobileNavItem } from "../shared/components/navbar/MobileNavItem";
import { MoreSheet } from "../shared/components/navbar/MoreSheet";
import { isStandaloneRoute } from "../app/routes.config";

const Navbar: React.FC = () => {
  const screenWidth = useScreenWidth();
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const currentLocation = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Standalone routes (auth, share pages) render without the app shell.
  if (isStandaloneRoute(currentLocation.pathname)) {
    return null;
  }

  const isMobile = screenWidth <= 1016;

  if (!isMobile) {
    return null; // Desktop layout is handled by Layout.tsx using Sidebar/Topbar
  }

  return (
    <>
      <div className="w-full h-[68px] shrink-0 border-t border-hairline/10 flex items-center justify-around px-2 z-50 bg-scrim order-last pb-safe relative">
        <MobileNavItem to="/foryou" icon={FaHome} />
        <MobileNavItem to="/discover" icon={BiSolidCompass} />
        <MobileNavItem to="/marketplace" icon={BiSolidStore} />
        <button
          aria-label="More"
          onClick={() => setIsMoreOpen(true)}
          className="relative flex items-center justify-center w-12 h-12 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <FiMoreHorizontal className="text-[26px]" />
        </button>
      </div>

      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        isSignedIn={!!isSignedIn}
        user={user}
      />
    </>
  );
};

export default Navbar;

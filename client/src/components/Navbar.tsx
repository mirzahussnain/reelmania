import React from "react";
import { FaHome, FaRegEdit } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { BiSolidVideo } from "react-icons/bi";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";

import { MobileNavItem } from "../shared/components/navbar/MobileNavItem";
import { MobileUserItem } from "../shared/components/navbar/MobileUserItem";
import { isStandaloneRoute } from "../app/routes.config";
import { Button } from "../shared/components/ui/Button";

const Navbar: React.FC = () => {
  const screenWidth = useScreenWidth();
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const currentLocation = useLocation();

  // Standalone routes (auth, share pages) render without the app shell.
  if (isStandaloneRoute(currentLocation.pathname)) {
    return null;
  }

  const isMobile = screenWidth <= 1016;

  if (!isMobile) {
    return null; // Desktop layout is handled by Layout.tsx using Sidebar/Topbar
  }

  return (
    <div className="w-full h-[68px] shrink-0 border-t border-hairline/10 flex items-center justify-around px-2 z-50 bg-scrim order-last pb-safe relative">
      <MobileNavItem to="/foryou" icon={FaHome} />
      <MobileNavItem to="/explore" icon={BiSolidVideo} />
      {isSignedIn && user && (
        <MobileNavItem to={`/users/${user.username}/videos/manage`} icon={FaRegEdit} />
      )}
      {isSignedIn ? (
        <MobileUserItem user={user} pathname={currentLocation.pathname} />
      ) : (
        <Button variant="primary" size="sm" className="font-bold" onClick={() => navigateTo("/sign-in")}>
          Sign in
        </Button>
      )}
    </div>
  );
};

export default Navbar;

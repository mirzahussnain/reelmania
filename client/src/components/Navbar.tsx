import React from "react";
import { FaHome, FaRegEdit } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { MdManageAccounts } from "react-icons/md";
import { BiSolidVideo } from "react-icons/bi";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";

import { DesktopNavItem } from "../shared/components/navbar/DesktopNavItem";
import { MobileNavItem } from "../shared/components/navbar/MobileNavItem";
import { MobileUserItem } from "../shared/components/navbar/MobileUserItem";

const Navbar: React.FC = () => {
  const screenWidth = useScreenWidth();
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const currentLocation = useLocation();

  if (currentLocation.pathname.includes("/sign-in") || currentLocation.pathname.includes("/sign-up")) {
    return null;
  }

  const isMobile = screenWidth <= 1016;

  if (isMobile) {
    return (
      <div className="w-full h-[68px] shrink-0 border-t border-white/10 flex items-center justify-around px-2 z-50 bg-black order-last pb-safe relative">
        <MobileNavItem to="/foryou" icon={FaHome} />
        <MobileNavItem to="/explore" icon={BiSolidVideo} />
        {isSignedIn && user && (
          <MobileNavItem to={`/users/${user.username}/videos/manage`} icon={FaRegEdit} />
        )}
        {isSignedIn ? (
          <MobileUserItem user={user} pathname={currentLocation.pathname} />
        ) : (
          <button
            className="px-4 py-1.5 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container text-sm"
            onClick={() => navigateTo("/sign-in")}
          >
            Sign in
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-16 shrink-0 border-b border-white/10 flex items-center justify-between px-6 z-50 bg-surface-container/80 backdrop-blur-xl">
      <div className="flex items-center">
        <Link to="/foryou">
          <img src="/images/logo-3.png" className="w-[140px] object-contain drop-shadow-md" alt="Logo" />
        </Link>
      </div>

      <nav className="flex items-center gap-2">
        <DesktopNavItem to="/foryou" icon={FaHome} label="Home" />
        <DesktopNavItem to="/explore" icon={BiSolidVideo} label="Explore" />
        
        {isSignedIn && user && (
          <>
            <DesktopNavItem to={`/users/${user.username}/videos/manage`} icon={FaRegEdit} label="Manage Videos" />
            {user.role?.toLowerCase() === "admin" && (
              <DesktopNavItem to="/admin" icon={MdManageAccounts} label="Admin Panel" />
            )}
          </>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {isSignedIn && user ? (
          <div className="flex items-center gap-3">
            <span className="text-on-surface font-medium mr-2">
              {user.username}
            </span>
            <UserButton
              appearance={{ elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } } }}
              userProfileMode="navigation"
              userProfileUrl={`/users/${user.id}/profile/manage`}
            />
          </div>
        ) : (
          <button
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container hover:shadow-[0_0_15px_var(--color-primary)] transition-all"
            onClick={() => navigateTo("/sign-in")}
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;

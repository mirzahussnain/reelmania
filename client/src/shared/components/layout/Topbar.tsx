import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { FaCog, FaBell } from "react-icons/fa";
import { useAppSelector } from "../../../utils/hooks/storeHooks";
import { RootState } from "../../../utils/store/store";
import { cn } from "../../utils/cn";

export const Topbar: React.FC = () => {
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full h-20 shrink-0 flex items-center justify-between px-8 z-40 bg-transparent relative pointer-events-auto">
      
      {/* Left side empty because Sidebar handles logo */}
      <div className="w-[120px]" />

      {/* Center Tabs: Following | For You */}
      <div className="flex items-center gap-8 font-inter font-semibold text-[17px]">
        <Link 
          to="/following" 
          className={cn(
            "relative px-1 py-2 transition-colors",
            location.pathname === "/following" ? "text-white" : "text-on-surface-variant hover:text-white"
          )}
        >
          Following
          {location.pathname === "/following" && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full shadow-[0_0_10px_var(--color-primary)]" />
          )}
        </Link>
        <Link 
          to="/foryou" 
          className={cn(
            "relative px-1 py-2 transition-colors",
            location.pathname === "/foryou" || location.pathname === "/" ? "text-white" : "text-on-surface-variant hover:text-white"
          )}
        >
          For You
          {(location.pathname === "/foryou" || location.pathname === "/") && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full shadow-[0_0_10px_var(--color-primary)]" />
          )}
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6 w-[120px] justify-end">
        {isSignedIn && user ? (
          <>
            <button className="text-on-surface-variant hover:text-white transition-colors hover:scale-110 drop-shadow-md">
              <FaBell className="text-[22px]" />
            </button>
            <button className="text-on-surface-variant hover:text-white transition-colors hover:scale-110 drop-shadow-md">
              <FaCog className="text-[22px]" />
            </button>
            <div className="ml-2 hover:scale-105 transition-transform hover:shadow-[0_0_15px_var(--color-primary)] rounded-full">
              <UserButton
                appearance={{ elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } } }}
                userProfileMode="navigation"
                userProfileUrl={`/users/${user.id}/profile/manage`}
              />
            </div>
          </>
        ) : (
          <button
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container hover:shadow-[0_0_15px_var(--color-primary)] transition-all whitespace-nowrap"
            onClick={() => navigateTo("/sign-in")}
          >
            Sign in
          </button>
        )}
      </div>

    </header>
  );
};

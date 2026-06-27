import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { FaCog, FaBell } from "react-icons/fa";
import { useAppSelector } from "../../../utils/hooks/storeHooks";
import { RootState } from "../../../utils/store/store";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

export const Topbar: React.FC = () => {
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full h-20 shrink-0 flex items-center justify-between px-8 z-40 bg-transparent relative pointer-events-auto">

      {/* Left spacer — Sidebar handles logo */}
      <div className="w-[120px]" />

      {/* Center Tabs - Contextual based on Route */}
      <div className="flex items-center gap-8 font-inter font-semibold text-[17px]">
        {location.pathname.startsWith("/explore") ? (
          <>
            <Link
              to="/explore"
              className={cn(
                "relative px-1 py-2 transition-colors",
                location.pathname === "/explore" ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Trending
              {location.pathname === "/explore" && (
                <div className="neon-bar absolute bottom-0 left-0 w-full" />
              )}
            </Link>
            <Link
              to="/explore?tab=videos"
              className={cn(
                "relative px-1 py-2 transition-colors",
                location.search.includes("tab=videos") ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Videos
              {location.search.includes("tab=videos") && (
                <div className="neon-bar absolute bottom-0 left-0 w-full" />
              )}
            </Link>
            <Link
              to="/explore?tab=assets"
              className={cn(
                "relative px-1 py-2 transition-colors",
                location.search.includes("tab=assets") ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              3D Assets
              {location.search.includes("tab=assets") && (
                <div className="neon-bar absolute bottom-0 left-0 w-full" />
              )}
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/following"
              className={cn(
                "relative px-1 py-2 transition-colors",
                location.pathname === "/following" ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Following
              {location.pathname === "/following" && (
                <div className="neon-bar absolute bottom-0 left-0 w-full" />
              )}
            </Link>
            <Link
              to="/foryou"
              className={cn(
                "relative px-1 py-2 transition-colors",
                location.pathname === "/foryou" || location.pathname === "/" ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              For You
              {(location.pathname === "/foryou" || location.pathname === "/") && (
                <div className="neon-bar absolute bottom-0 left-0 w-full" />
              )}
            </Link>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6 w-[120px] justify-end">
        {isSignedIn && user ? (
          <>
            <Button variant="unstyled" className="text-on-surface-variant hover:text-on-surface transition-colors hover:scale-110 drop-shadow-md">
              <FaBell className="text-[22px]" />
            </Button>
            <Button variant="unstyled" className="text-on-surface-variant hover:text-on-surface transition-colors hover:scale-110 drop-shadow-md">
              <FaCog className="text-[22px]" />
            </Button>
            <div className="ml-2 hover:scale-105 transition-transform hover:glow-primary rounded-full">
              <UserButton
                appearance={{ elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } } }}
                userProfileMode="navigation"
                userProfileUrl={`/users/${user.id}/profile/manage`}
              />
            </div>
          </>
        ) : (
          <Button className="text-base font-bold" onClick={() => navigateTo("/sign-in")}>
            Sign in
          </Button>
        )}
      </div>

    </header>
  );
};

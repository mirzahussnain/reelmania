import React, { useEffect, useState, useCallback } from "react";
import { FaHome, FaRegEdit } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaX } from "react-icons/fa6";
import { SignOutButton, UserButton, useUser } from "@clerk/clerk-react";
import { MdManageAccounts } from "react-icons/md";
import { BiSolidVideo } from "react-icons/bi";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";

const NavItem = ({ to, icon: Icon, label, isMobile }: { to: string; icon: React.ElementType; label: string; isMobile?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-2 transition-all duration-300
      ${isMobile ? "w-full p-4 border-b border-white/5 justify-start text-lg" : "px-4 py-2 rounded-full justify-center"}
      ${isActive 
        ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(208,188,255,0.2)]" 
        : "text-on-surface-variant hover:text-white hover:bg-white/5"}
    `}
  >
    <Icon className="text-2xl" />
    <span className="font-medium tracking-wide">{label}</span>
  </NavLink>
);

const Navbar: React.FC = () => {
  const screenWidth = useScreenWidth();
  const [showNav, setShowNav] = useState(screenWidth > 1016);
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const currentLocation = useLocation();

  const toggleNav = useCallback(() => setShowNav((prev) => !prev), []);

  useEffect(() => {
    if (screenWidth > 1016) setShowNav(true);
    else setShowNav(false);
  }, [screenWidth]);

  if (currentLocation.pathname.includes("/sign-in") || currentLocation.pathname.includes("/sign-up")) {
    return null;
  }

  const isMobile = screenWidth <= 1016;

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 text-white p-2 bg-surface-container/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg"
          onClick={toggleNav}
        >
          {showNav ? <FaX className="text-xl" /> : <IoMenu className="text-2xl" />}
        </button>
      )}

      {/* Navigation Container (Desktop Topbar / Mobile Sidebar) */}
      <div
        className={`
          z-40 transition-all duration-500 ease-out bg-surface-container/80 backdrop-blur-xl border-white/10
          ${isMobile 
            ? `fixed top-0 left-0 h-dvh border-r ${showNav ? "w-[280px] translate-x-0" : "w-0 -translate-x-full overflow-hidden"}`
            : "w-full h-16 border-b flex items-center justify-between px-6"
          }
        `}
      >
        <div className={`flex ${isMobile ? "flex-col h-full" : "w-full items-center justify-between"}`}>
          
          {/* Logo Section */}
          <div className={`${isMobile ? "p-6 border-b border-white/5" : "flex items-center"}`}>
            <Link to="/foryou">
              <img src="/images/logo-3.png" className="w-[140px] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" alt="Logo" />
            </Link>
            {isMobile && isSignedIn && user && (
              <p className="mt-4 text-on-surface-variant text-sm">
                Hi, <strong className="text-white">{user.username}</strong>
              </p>
            )}
          </div>

          {/* Links Section */}
          <nav className={`flex ${isMobile ? "flex-col flex-1 overflow-y-auto" : "items-center gap-2"}`}>
            <NavItem to="/foryou" icon={FaHome} label="Home" isMobile={isMobile} />
            <NavItem to="/explore" icon={BiSolidVideo} label="Explore" isMobile={isMobile} />
            
            {isSignedIn && user && (
              <>
                <NavItem to={`/users/${user.username}/videos/manage`} icon={FaRegEdit} label="Manage Videos" isMobile={isMobile} />
                {isMobile && <NavItem to={`/users/${user.id}/profile/manage`} icon={MdManageAccounts} label="Profile" isMobile={isMobile} />}
                {user.role?.toLowerCase() === "admin" && (
                  <NavItem to="/admin" icon={MdManageAccounts} label="Admin Panel" isMobile={isMobile} />
                )}
              </>
            )}
          </nav>

          {/* Auth / Profile Section */}
          <div className={`${isMobile ? "p-6 border-t border-white/5" : "flex items-center gap-4"}`}>
            {isSignedIn && user ? (
              <div className="flex items-center gap-3">
                {!isMobile && (
                  <span className="text-on-surface font-medium hidden lg:block mr-2">
                    {user.username}
                  </span>
                )}
                <UserButton
                  appearance={{ elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } } }}
                  userProfileMode="navigation"
                  userProfileUrl={`/users/${user.id}/profile/manage`}
                />
                {isMobile && (
                  <div className="w-full mt-4">
                    <SignOutButton>
                      <button className="w-full py-2 bg-error/20 text-error hover:bg-error/30 rounded-lg transition-colors font-medium">
                        Sign Out
                      </button>
                    </SignOutButton>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="w-full lg:w-auto px-6 py-2 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container hover:shadow-[0_0_15px_rgba(208,188,255,0.4)] transition-all"
                onClick={() => navigateTo("/sign-in")}
              >
                Sign in
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobile && showNav && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleNav}
        />
      )}
    </>
  );
};

export default Navbar;

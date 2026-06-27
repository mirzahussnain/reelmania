import React from "react";
import { motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { FaBell, FaCog } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import { cn } from "../../utils/cn";
import { useState } from "react";
import { BRAND } from "../../constants/brand";
import { getNavItems } from "../../../app/routes.config";
import { useAppSelector } from "../../../utils/hooks/storeHooks";
import { RootState } from "../../../utils/store/store";
import { Button } from "../ui/Button";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, activeIcon: ActiveIcon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "group relative flex items-center h-12 w-full px-5 transition-all duration-300 rounded-lg overflow-hidden",
      isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
    )}
  >
    {({ isActive }) => (
      <>
        {/* Active laser line indicator */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full glow-primary-sm" />
        )}

        <div className="min-w-[24px] flex items-center justify-center">
          {isActive ? (
            <ActiveIcon className="text-2xl drop-shadow-[0_0_10px_var(--color-primary)]" />
          ) : (
            <Icon className="text-2xl" />
          )}
        </div>

        <span className="ml-5 font-inter font-semibold text-[15px] whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          {label}
        </span>
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { isSignedIn } = useUser();
  const user = useAppSelector((state: RootState) => state.user);
  const navigateTo = useNavigate();
  const primaryNav = getNavItems("primary");
  const libraryNav = getNavItems("library");

  return (
    <div
      className="w-[80px] h-full shrink-0 relative z-50 group/sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.aside
        initial={{ width: 80 }}
        animate={{ width: isHovered ? 240 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
        className="absolute top-0 left-0 h-full bg-surface/70 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-[18px] shrink-0 border-b border-outline-variant/20">
          <Link to="/foryou" className="flex items-center gap-3 w-full">
            <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <motion.img
                src="/images/kinetix_lg.png"
                animate={{ scale: isHovered ? 1.3 : 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                className="w-full h-full object-contain drop-shadow-md"
                alt="Logo"
              />
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 flex items-center">
              <span className="font-syne font-bold text-xl text-on-surface tracking-wide">{BRAND}</span>
            </div>
          </Link>
        </div>

        {/* Account Section — avatar + username, with notifications & settings */}
        <div className="px-[18px] py-4 shrink-0 border-b border-outline-variant/10">
          {isSignedIn && user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full hover:glow-primary transition-all">
                <UserButton
                  appearance={{ elements: { avatarBox: { width: "2.25rem", height: "2.25rem" } } }}
                  userProfileMode="navigation"
                  userProfileUrl={`/users/${user.id}/profile/manage`}
                />
              </div>
              <div className="flex items-center justify-between flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                <span className="font-inter font-semibold text-sm text-on-surface truncate">
                  @{user.username}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="unstyled" aria-label="Notifications" className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
                    <FaBell className="text-[16px]" />
                  </Button>
                  <Button variant="unstyled" aria-label="Settings" className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors">
                    <FaCog className="text-[16px]" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigateTo("/sign-in")}
              className="flex items-center gap-3 w-full text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                <FiLogIn className="text-[16px]" />
              </div>
              <span className="font-inter font-semibold text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                Sign in
              </span>
            </button>
          )}
        </div>

        {/* Navigation Links — derived from routes.config.ts */}
        <nav className="flex-1 flex flex-col gap-2 py-6 px-3">
          {primaryNav.map(({ path, nav }) => (
            <SidebarItem key={path} to={path} icon={nav!.icon} activeIcon={nav!.activeIcon} label={nav!.label} />
          ))}
          <div className="h-4" />
          {libraryNav.map(({ path, nav }) => (
            <SidebarItem key={path} to={path} icon={nav!.icon} activeIcon={nav!.activeIcon} label={nav!.label} />
          ))}
        </nav>

        {/* Bottom Logo / Watermark Section */}
        <div className="mt-auto p-4 shrink-0 border-t border-outline-variant/10 flex justify-center items-center overflow-hidden">
          <Link to="/">
            <motion.div
              animate={{ width: isHovered ? 190 : 0, opacity: isHovered ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
              className="h-32 shrink-0 rounded-md flex flex-col justify-center items-center cursor-pointer overflow-hidden relative border border-hairline/10 bg-linear-to-b from-surface-container-high/50 to-surface-container-low/30 shadow-lg group/logo"
            >
              {/* soft glow pooling at the bottom of the card */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary/15 to-transparent" />
              <motion.img
                src="/images/kinetix_logo.png"
                animate={{ scale: isHovered ? 1 : 0.6 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                className="w-40 h-40 shrink-0 object-contain grayscale opacity-40 group-hover/logo:grayscale-0 group-hover/logo:opacity-100 transition-[filter,opacity] duration-500 drop-shadow-[0_0_14px_rgba(208,188,255,0.45)] relative z-10"
                alt={`${BRAND} Logo`}
              />
            </motion.div>
          </Link>
        </div>
      </motion.aside>
    </div>
  );
};

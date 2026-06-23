import React from "react";
import { motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useState } from "react";
import { BRAND } from "../../constants/brand";
import { getNavItems } from "../../../app/routes.config";

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
        className="absolute top-0 left-0 h-full bg-surface flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-[18px] shrink-0 border-b border-outline-variant/20">
          <Link to="/foryou" className="flex items-center gap-3 w-full">
            <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <img src="/images/logo-3.png" className="w-full h-full object-contain drop-shadow-md scale-[1.7]" alt="Logo" />
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 flex items-center">
              <span className="font-syne font-bold text-xl text-on-surface tracking-wide">{BRAND}</span>
            </div>
          </Link>
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
      </motion.aside>
    </div>
  );
};

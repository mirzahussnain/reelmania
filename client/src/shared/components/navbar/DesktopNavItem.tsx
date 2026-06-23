import React from "react";
import { NavLink } from "react-router-dom";

interface DesktopNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

export const DesktopNavItem: React.FC<DesktopNavItemProps> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-2 px-4 py-2 rounded-full justify-center transition-all duration-300
      ${isActive 
        ? "text-primary bg-primary/10 glow-primary opacity-80" 
        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"}
    `}
  >
    <Icon className="text-2xl" />
    <span className="font-medium tracking-wide">{label}</span>
  </NavLink>
);

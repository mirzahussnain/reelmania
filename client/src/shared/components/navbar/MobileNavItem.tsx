import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

interface MobileNavItemProps {
  to: string;
  icon: React.ElementType;
}

export const MobileNavItem: React.FC<MobileNavItemProps> = ({ to, icon: Icon }) => (
  <NavLink
    to={to}
    className="relative flex items-center justify-center w-12 h-12 rounded-full"
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="mobile-nav-indicator"
            className="absolute inset-0 bg-primary rounded-full glow-primary opacity-90"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon className={`text-[26px] relative z-10 transition-colors duration-300 ${isActive ? 'text-on-primary drop-shadow-md scale-110' : 'text-on-surface-variant hover:text-on-surface'}`} />
      </>
    )}
  </NavLink>
);

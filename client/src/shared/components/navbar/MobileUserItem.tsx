import React from "react";
import { UserButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { userType } from "../../../types";

interface MobileUserItemProps {
  user: userType;
  pathname: string;
}

export const MobileUserItem: React.FC<MobileUserItemProps> = ({ user, pathname }) => {
  const isActive = pathname.includes(`/profile/manage`);
  
  return (
    <div className="relative flex items-center justify-center w-12 h-12 rounded-full">
      {isActive && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute inset-0 bg-primary rounded-full shadow-[0_0_15px_var(--color-primary)] opacity-90"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center justify-center">
        <UserButton
          appearance={{ elements: { avatarBox: { width: "1.8rem", height: "1.8rem", border: isActive ? "2px solid white" : "none" } } }}
          userProfileMode="navigation"
          userProfileUrl={`/users/${user?.id}/profile/manage`}
        />
      </div>
    </div>
  );
};

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { FaBell, FaCog } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { getNavItems } from "../../../app/routes.config";
import { userType } from "../../../types";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  user: userType | null;
}

/**
 * Mobile "More" bottom sheet. The mobile bottom bar holds only the 3 primary
 * destinations + a More button; everything else (library, Your Network, account
 * actions) lives here so the bar never overflows.
 */
export const MoreSheet: React.FC<MoreSheetProps> = ({ isOpen, onClose, isSignedIn, user }) => {
  const navigateTo = useNavigate();
  const libraryItems = getNavItems("library");

  // Extra destinations not in the sidebar nav groups.
  const extraItems = isSignedIn
    ? [{ path: "/following", label: "Your Network", icon: FiHeart }]
    : [];

  const go = (to: string) => {
    navigateTo(to);
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} variant="bottom" className="bg-surface-container-low border-t border-outline-variant/20 rounded-t-2xl p-5 pb-safe shadow-2xl">
      <div className="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto mb-5" />

      {/* Account row */}
      {isSignedIn && user ? (
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-outline-variant/10">
          <UserButton
            appearance={{ elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } } }}
            userProfileMode="navigation"
            userProfileUrl={`/users/${user.id}/profile/manage`}
          />
          <span className="font-inter font-semibold text-on-surface truncate flex-1">@{user.username}</span>
          <Button variant="unstyled" aria-label="Notifications" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <FaBell className="text-[18px]" />
          </Button>
          <Button variant="unstyled" aria-label="Settings" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <FaCog className="text-[18px]" />
          </Button>
        </div>
      ) : (
        <Button fullWidth className="mb-6 font-bold" onClick={() => go("/sign-in")}>
          Sign in
        </Button>
      )}

      {/* Destinations grid */}
      <div className="grid grid-cols-3 gap-3">
        {[...extraItems, ...libraryItems.map((r) => ({ path: r.path, label: r.nav!.label, icon: r.nav!.icon }))].map(
          ({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-surface-container border border-outline-variant/10 text-on-surface-variant hover:text-on-surface hover:border-primary/40 transition-colors"
            >
              <Icon className="text-2xl" />
              <span className="text-xs font-inter font-semibold">{label}</span>
            </Link>
          )
        )}
      </div>
    </Sheet>
  );
};

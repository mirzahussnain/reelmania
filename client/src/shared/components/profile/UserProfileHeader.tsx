import React from "react";
import { userType } from "../../../types";
import { HiOutlineUserAdd, HiOutlineUserRemove } from "react-icons/hi";
import { StatBlock } from "../ui/StatBlock";
import { Button } from "../ui/Button";
import { BadgeRow } from "../ui/Badge";
import { COLLECTION_UNIT } from "../../constants/curation";

// Fallback copy when a user hasn't written a bio yet.
const DEFAULT_BIO = "Curating on Kinetix.";

interface UserProfileHeaderProps {
  userProfile: userType;
  followerCount: number;
  videoCount: number;
  isCurrentUser: boolean;
  followStatus: boolean;
  handleFollow: () => void;
  className?: string;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  userProfile,
  followerCount,
  videoCount,
  isCurrentUser,
  followStatus,
  handleFollow,
  className = "pt-8 md:pt-16"
}) => {
  const bio = userProfile.bio?.trim() || DEFAULT_BIO;

  return (

    <div className={`flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in ${className}`}>



      {/* Avatar */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 ring-2 ring-primary glow-primary-lg hover:scale-105">
        <img
          className="w-full h-full rounded-full object-cover"
          src={userProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.username}`}
          alt={userProfile.username}
        />
      </div>

      {/* Identity */}
      <h1 className="text-2xl md:text-6xl lg:text-7xl font-syne font-black uppercase tracking-wider text-on-surface mt-8 text-center">
        {userProfile.first_name}_{userProfile.last_name}
      </h1>

      {/* Earned badges — server-derived, client only renders */}
      <BadgeRow badges={userProfile.badges} size={84} className="justify-center mt-4" />

      <div className="w-full flex justify-center px-4 mt-4">
        <p className="text-on-surface-variant text-sm md:text-base w-[90%] max-w-[500px] text-center leading-relaxed font-mono">
          {bio}
        </p>
      </div>

      {/* Stats Block */}
      <div className="card-glass flex items-center gap-8 md:gap-16 px-8 md:px-16 py-6 mt-10">
        <StatBlock value={followerCount.toLocaleString()} label="Network" tone="primary" align="center" />
        <div className="divider-v"></div>
        <StatBlock value={videoCount} label={`${COLLECTION_UNIT}s`} align="center" />
        <div className="divider-v"></div>
        {/* C-Score reads the persisted percentile; 0 until the scoring job runs. */}
        <StatBlock value={userProfile.c_score ?? 0} label="C-Score" tone="secondary" align="center" />
      </div>

      {/* Connect Button */}
      {!isCurrentUser && (
        <Button
          variant="unstyled"
          onClick={handleFollow}
          className={`mt-10 px-8 py-3 rounded-full flex items-center gap-2 font-bold transition-all duration-300 hover:scale-105 ${followStatus
            ? "bg-surface-variant text-on-surface hover:bg-surface-variant/80 border border-outline-variant/20"
            : "bg-primary text-on-primary glow-primary hover:glow-primary-lg"
            }`}
        >
          {followStatus ? (
            <>
              <HiOutlineUserRemove className="text-xl" />
              Disconnect
            </>
          ) : (
            <>
              <HiOutlineUserAdd className="text-xl" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  );
};

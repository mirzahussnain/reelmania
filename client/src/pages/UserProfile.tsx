import React from "react";
import Loader from "../components/Loader";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { UserProfileHeader } from "../shared/components/profile/UserProfileHeader";
import { UserVideoGrid } from "../shared/components/profile/UserVideoGrid";

const UserProfile: React.FC = () => {
  const {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading
  } = useUserProfile();

  if (isLoading) {
    return <Loader />;
  }

  if (!userProfile) {
    return (
      <div className="w-full h-full bg-surface flex justify-center items-center text-on-surface-variant font-jetbrains">
        User not found.
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userProfile.id;

  return (
    <div className="page-shell pb-24">
      <UserProfileHeader
        userProfile={userProfile}
        followerCount={followerCount}
        videoCount={userVideos?.length || 0}
        isCurrentUser={isCurrentUser}
        followStatus={followStatus}
        handleFollow={handleFollow}
      />
      <UserVideoGrid userVideos={userVideos || []} />
    </div>
  );
};

export default UserProfile;

import React from "react";
import Loader from "../components/Loader";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { UserProfileHeader } from "../shared/components/profile/UserProfileHeader";
import { ProfileFeatured } from "../shared/components/profile/ProfileFeatured";

const UserProfile: React.FC = () => {
  const {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading,
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
    // Transparent bg so the app's network-mesh background shows through
    // (page-shell's opaque bg-surface would hide it).
    <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-transparent text-on-surface pt-6 pb-24 flex flex-col items-center">
      <UserProfileHeader
        userProfile={userProfile}
        followerCount={followerCount}
        videoCount={userVideos?.length || 0}
        isCurrentUser={isCurrentUser}
        followStatus={followStatus}
        handleFollow={handleFollow}
      />
      <ProfileFeatured
        userProfile={userProfile}
        userVideos={userVideos || []}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
};

export default UserProfile;

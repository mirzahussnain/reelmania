import React from "react";
import Loader from "../components/Loader";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { UserProfileHeader } from "../shared/components/profile/UserProfileHeader";
import { UserVideoGrid } from "../shared/components/profile/UserVideoGrid";
import { Link } from "react-router-dom";
import { BRAND } from "../shared/constants/brand";

const PublicProfile: React.FC = () => {
  const {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading
  } = useUserProfile();

  if (isLoading) return <Loader />;

  if (!userProfile) {
    return (
      <div className="w-full h-screen bg-background flex justify-center items-center text-on-surface-variant font-jetbrains">
        User not found.
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userProfile.id;

  return (
    <div className="w-full min-h-screen bg-background relative flex flex-col items-center pt-10 pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
      </div>

      {/* Brand / Logo area */}
      <header className="w-full flex justify-center mb-10">
        <span className="text-4xl md:text-5xl font-syne font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-glow-primary">
          {BRAND}
        </span>
      </header>

      {/* Main Content Container */}
      <div className="w-full flex flex-col items-center justify-start mt-4">
        <UserProfileHeader
          userProfile={userProfile}
          followerCount={followerCount}
          videoCount={userVideos?.length || 0}
          isCurrentUser={isCurrentUser}
          followStatus={followStatus}
          handleFollow={handleFollow}
          className="pt-2"
        />

        {/* Show top 3 videos only */}
        <div className="w-full max-w-5xl mt-6">
          <UserVideoGrid
            userVideos={(userVideos || []).slice(0, 3)}
            className="mt-0 pb-0"
          />
        </div>
      </div>

      {/* Experience Kinetix CTA */}
      <div className="w-[90%] max-w-4xl rounded-3xl border border-hairline/5 bg-gradient-to-b from-hairline/[0.04] to-transparent p-12 mt-12 mb-20 flex flex-col items-center z-10 relative overflow-hidden backdrop-blur-md">
        
        <h3 className="text-3xl md:text-4xl font-syne font-bold text-on-surface text-center">
          Experience {BRAND}
        </h3>
        
        <div className="w-full flex justify-center mt-4">
          <p className="text-on-surface-variant text-base md:text-lg w-[90%] max-w-[600px] text-center leading-relaxed">
            Join the network to curate your own archives and immerse yourself in high-fidelity anime shorts.
          </p>
        </div>
        
        <Link
          to="/sign-up"
          className="mt-8 border border-secondary/50 bg-transparent hover:bg-secondary/10 text-secondary text-sm md:text-base font-bold px-10 py-3 rounded-full transition-all duration-300"
        >
          Join the Network
        </Link>
      </div>

    </div>
  );
};

export default PublicProfile;

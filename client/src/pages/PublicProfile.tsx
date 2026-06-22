import React from "react";
import Loader from "../components/Loader";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { UserProfileHeader } from "../shared/components/profile/UserProfileHeader";
import { UserVideoGrid } from "../shared/components/profile/UserVideoGrid";
import { Link } from "react-router-dom";

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
      <div className="w-full h-screen bg-[#111317] flex justify-center items-center text-on-surface-variant font-mono">
        User not found.
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userProfile.id;

  return (
    <div className="w-full h-full bg-[#111317] overflow-y-auto scrollbar-hide flex flex-col items-center pt-10 pb-10 relative">
      
      {/* Top Logo */}
      <h2 className="text-2xl font-syne font-bold text-primary mb-2 z-10 drop-shadow-lg tracking-wider">
        Komorebi
      </h2>

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
        
        {/* Slicing the userVideos to only show top 3 */}
        <div className="w-full max-w-5xl mt-6">
          <UserVideoGrid 
            userVideos={(userVideos || []).slice(0, 3)} 
            className="mt-0 pb-0" 
          />
        </div>
      </div>

      {/* Experience Komorebi CTA */}
      <div className="w-[90%] max-w-4xl bg-surface-container/40 border border-white/5 rounded-2xl p-8 mt-12 backdrop-blur-md flex flex-col items-center z-10">
        <h3 className="text-2xl md:text-3xl font-syne font-bold text-white">Experience Komorebi</h3>
        <div className="w-full flex justify-center mt-3">
          <p className="text-on-surface-variant text-sm md:text-base w-[90%] max-w-[500px] text-center leading-relaxed">
            Join the network to curate your own archives and immerse yourself in high-fidelity anime shorts.
          </p>
        </div>
        <Link 
          to="/sign-up"
          className="mt-8 border border-white text-white text-base font-bold px-10 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
        >
          Join the Network
        </Link>
      </div>

    </div>
  );
};

export default PublicProfile;

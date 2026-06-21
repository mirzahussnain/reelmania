import React, { useEffect, useState } from "react";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { useGetMyProfileQuery } from "../utils/store/features/user/userApi";
import { useLazyFetchAllVideosQuery } from "../utils/store/features/video/videoApi";
import { VideoType } from "../types";
import { useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { FaBell } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import Loader from "../components/Loader";

const Vault: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state: RootState) => state.user);
  const { token } = useAppSelector((state: RootState) => state.auth);
  
  const queryParam = { id: user?.id, token };
  const { data: profileData, isLoading: profileLoading } = useGetMyProfileQuery(queryParam, {
    skip: !user?.id || !token,
  });
  
  const userProfile = profileData?.body;

  const [getVideos] = useLazyFetchAllVideosQuery();
  const [userVideos, setUserVideos] = useState<VideoType[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [activeTab, setActiveTab] = useState("My Uploads");

  useEffect(() => {
    const fetchVideos = async () => {
      if (userProfile) {
        try {
          setIsLoadingVideos(true);
          const result = await getVideos({}).unwrap();
          const fetchedVideos = result?.videos?.filter(
            (video: VideoType) => video?.uploaded_by?.username === userProfile.username
          ) || [];
          setUserVideos(fetchedVideos);
        } catch (error) {
          console.error("Error fetching vault videos:", error);
        } finally {
          setIsLoadingVideos(false);
        }
      }
    };
    fetchVideos();
  }, [userProfile, getVideos]);

  if (profileLoading) return <Loader />;

  return (
    <div className="w-full h-full flex flex-col bg-background text-white overflow-y-auto overflow-x-hidden scrollbar-hide">
      
      {/* 1. Cinematic Banner Section */}
      <div className="relative w-full h-[35vh] lg:h-[45vh] shrink-0">
        <img 
          src="/images/vault-banner.png" 
          alt="Vault Banner" 
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay to fade into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
        
        {/* Top Header (Absolute over banner) */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition"
            >
              <BiArrowBack className="text-xl text-white" />
            </button>
            <span className="font-jetbrains text-sm text-primary tracking-widest font-semibold drop-shadow-md">
              USER_VAULT / ARCHIVE_001
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-5 py-2 rounded-full bg-black/40 backdrop-blur-md text-sm font-semibold hover:bg-black/60 transition border border-white/10">
              Share Profile
            </button>
            <button className="px-5 py-2 rounded-full bg-black/40 backdrop-blur-md text-sm font-semibold hover:bg-black/60 transition border border-white/10">
              Share Network
            </button>
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition border border-white/10">
              <FaBell className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Floating Profile Card & Content */}
      <div className="px-6 lg:px-12 -mt-24 lg:-mt-32 relative z-20 flex flex-col pb-20">
        
        {/* Profile Card */}
        <div className="w-full bg-surface-container/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col lg:flex-row items-center lg:items-start gap-8">
          
          {/* Avatar Container */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <img 
                src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Status Badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-[3px] border-surface-container shadow-lg">
              <MdVerified className="text-on-primary text-sm" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 flex flex-col text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-syne font-bold tracking-wide">
              {userProfile?.first_name} {userProfile?.last_name}
            </h1>
            <h2 className="text-primary font-medium mt-1 mb-4">@{userProfile?.username}</h2>
            
            {/* Static Placeholder Bio (As requested) */}
            <p className="text-on-surface-variant text-sm lg:text-base max-w-2xl leading-relaxed mb-6">
              Digital curator & Motion designer. Exploring the intersection of lofi aesthetics and high-octane anime narratives. Founding member of the Neon Circle.
            </p>

            {/* Stats Block */}
            <div className="flex items-center justify-center lg:justify-start gap-8 lg:gap-12">
              <div className="flex flex-col items-start cursor-pointer hover:text-primary transition-colors">
                <span className="text-2xl lg:text-3xl font-syne font-bold">
                  {userProfile?._count?.followers_followers_following_idTousers || 0}
                </span>
                <span className="text-[10px] lg:text-xs text-on-surface-variant uppercase tracking-widest font-semibold mt-1">Network</span>
              </div>
              <div className="flex flex-col items-start cursor-pointer hover:text-primary transition-colors">
                <span className="text-2xl lg:text-3xl font-syne font-bold">{userVideos?.length || 0}</span>
                <span className="text-[10px] lg:text-xs text-on-surface-variant uppercase tracking-widest font-semibold mt-1">Collections</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl lg:text-3xl font-syne font-bold text-primary">89k</span>
                <span className="text-[10px] lg:text-xs text-on-surface-variant uppercase tracking-widest font-semibold mt-1">C-Score</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 rounded-xl bg-surface-variant border border-white/10 text-on-surface font-bold hover:bg-white/5 transition-colors">
              Connect
            </button>
            <button className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-[0_0_20px_var(--color-primary)] hover:scale-105 transition-transform">
              Edit Vault
            </button>
          </div>
        </div>

        {/* 3. Tab Navigation */}
        <div className="w-full mt-10 border-b border-white/10 flex items-center gap-8 px-2">
          {['My Uploads', 'Liked', 'Collections'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 relative font-jetbrains text-sm font-semibold tracking-wide transition-colors ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-white'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>

        {/* 4. Video Grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {isLoadingVideos ? (
            <div className="col-span-full py-10 flex justify-center">
              <Loader />
            </div>
          ) : userVideos.length > 0 ? (
            userVideos.map((video, idx) => (
              <div 
                key={video.id || idx}
                onClick={() => navigate(`/videos/${video.id}`, { state: video })}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-surface-container-low"
              >
                <video 
                  src={video.video_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Duration Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-jetbrains font-bold text-white">
                  00:15
                </div>

                {/* NEW Badge Logic (mocked on first item) */}
                {idx === 0 && (
                  <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md border border-primary px-2 py-1 rounded-md text-[10px] font-jetbrains font-bold text-primary shadow-[0_0_10px_var(--color-primary)]">
                    NEW
                  </div>
                )}
                
                {/* Info overlay on hover */}
                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="font-bold text-sm line-clamp-1">{video.title || "Untitled"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <p className="text-lg">No vaults archived yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Vault;

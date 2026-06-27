import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { VideoType } from "../types";
import { useNavigate } from "react-router-dom";
import { useFetchAllVideosQuery } from "../utils/store/features/video/videoApi";
import { EmptyState } from "../shared/components/ui/EmptyState";
import { VideoThumbnailCard } from "../shared/components/ui/VideoThumbnailCard";
import { EXPLORE_TAGS, EXPLORE_HERO, EXPLORE_NETWORK_LEADERBOARD } from "../shared/constants/mocks";
import { Button } from "../shared/components/ui/Button";
import { FiFolder, FiTag, FiUserPlus, FiAlertTriangle, FiRefreshCcw, FiUser } from "react-icons/fi";
import { BsLightningFill } from "react-icons/bs";

const Explore = () => {
  const navigateTo = useNavigate();
  // The active query args ARE the source of truth. RTK Query caches each
  // distinct {q, type} combination, so search is just changing these args —
  // no separate filtered-results slice to maintain.
  const [searchArgs, setSearchArgs] = useState<{ q?: string; type?: string }>({});
  const { data, isFetching, isError, refetch } = useFetchAllVideosQuery(searchArgs);
  const videos: VideoType[] = data?.data ?? [];

  return (
    <div className="min-h-full w-full pt-20 pb-24 flex flex-col items-center justify-start bg-gradient-to-br from-surface to-surface-container">
      <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col items-center justify-start mb-16">
        
        {/* Header Section */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-syne font-bold text-on-surface tracking-tight mb-2">
              Cinematic Discovery Hub
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant font-inter">
              Discover resonant streams and premium assets across the network.
            </p>
          </div>
          
          <div className="w-full lg:w-96 shrink-0">
            <SearchBar
              onSearch={(q, type) => setSearchArgs({ q, type })}
              onClear={() => setSearchArgs({})}
            />
          </div>
        </div>

        {/* Tags Row */}
        <div className="w-full flex overflow-x-auto scrollbar-hide gap-3 mb-10 pb-2">
          {EXPLORE_TAGS.map((tag) => (
            <button
              key={tag}
              className="px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-sm font-jetbrains font-semibold text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Hero & Network Section */}
        <div className="w-full flex flex-col xl:flex-row gap-6 mb-12">
          
          {/* Main Hero Banner */}
          <div className="relative w-full xl:w-[70%] h-[300px] md:h-[400px] lg:h-[450px] rounded-lg overflow-hidden group cursor-pointer border border-hairline/10">
            <img 
              src={EXPLORE_HERO.imageSrc} 
              alt={EXPLORE_HERO.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/40 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-col items-start pointer-events-none">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-[10px] md:text-[11px] font-jetbrains font-bold uppercase tracking-wider">
                  Trending Collection
                </span>
                <span className="bg-primary/20 backdrop-blur-md border border-primary/30 text-on-media px-3 py-1 rounded-full text-[10px] md:text-[11px] font-jetbrains font-bold flex items-center gap-1.5">
                  <FiTag className="text-primary" /> ${EXPLORE_HERO.price}
                </span>
                <span className="bg-scrim/60 backdrop-blur-md border border-hairline/20 text-on-media px-3 py-1 rounded-full text-[10px] md:text-[11px] font-jetbrains font-bold flex items-center gap-1.5">
                  <FiFolder className="text-on-media-dim" /> Project Files Available
                </span>
              </div>
              
              <h2 className="text-xl md:text-2xl lg:text-3xl font-syne font-black text-on-media uppercase tracking-wider mb-2 drop-shadow-lg">
                {EXPLORE_HERO.title}
              </h2>
              
              <div className="flex items-center gap-4 text-sm font-semibold text-on-media-dim">
                <span className="flex items-center gap-1.5">
                  <FiUser className="text-[15px]" /> @{EXPLORE_HERO.creatorUsername}
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <BsLightningFill /> {EXPLORE_HERO.cScore} C-Score (Top Seller)
                </span>
              </div>
            </div>
          </div>

          {/* Professional Network Sidebar */}
          <div className="w-full xl:w-[30%] bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 flex flex-col">
            <h3 className="flex items-center gap-2 text-primary font-syne font-bold text-lg mb-6 border-b border-outline-variant/20 pb-4">
              <FiUserPlus className="text-xl" /> Professional Network
            </h3>
            
            <div className="flex flex-col gap-5 flex-1">
              {EXPLORE_NETWORK_LEADERBOARD.map((user) => (
                <div key={user.username} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full border border-outline-variant/30 bg-surface-container"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer">
                        @{user.username}
                      </span>
                      <span className="text-xs font-jetbrains font-semibold text-primary flex items-center gap-1">
                        <BsLightningFill className="text-[10px]" /> {user.cScore} C-Score
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full bg-surface-container-high hover:bg-primary/20 hover:text-primary">
                    <FiUserPlus />
                  </Button>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-6"
              onClick={() => navigateTo("/coming-soon")}
            >
              View All Creators
            </Button>
          </div>
        </div>

        {/* Grid Section */}
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-syne font-bold text-on-surface mb-6">
            Trending Shorts & Assets
          </h2>
          
          {isFetching ? (
            <EmptyState message="Loading…" />
          ) : isError ? (
            <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center border border-error/20 bg-error/5 rounded-xl backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4 border border-error/20">
                <FiAlertTriangle className="text-3xl text-error" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2 font-syne uppercase tracking-wide text-error drop-shadow-md">
                Network Disruption
              </h3>
              <p className="text-on-surface-variant text-sm max-w-md mb-6 font-inter">
                We encountered an anomaly while syncing with the mainframe. The data stream could not be established.
              </p>
              <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2 hover:bg-error/10 hover:text-error hover:border-error/50 transition-colors">
                <FiRefreshCcw /> Re-establish Connection
              </Button>
            </div>
          ) : videos?.length === 0 ? (
            <EmptyState message="No videos to display" />
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
              {videos?.map((video, index) => (
                <VideoThumbnailCard
                  key={index}
                  video={video}
                  variant="grid"
                  index={index}
                  onClick={() => navigateTo(`/videos/${video?.id}`, { state: video })}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Explore;

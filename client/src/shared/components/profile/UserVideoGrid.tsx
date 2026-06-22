import React from "react";
import { useNavigate } from "react-router-dom";
import { VideoType } from "../../../types";
import { FiPlay } from "react-icons/fi";

interface UserVideoGridProps {
  userVideos: VideoType[];
  className?: string;
}

export const UserVideoGrid: React.FC<UserVideoGridProps> = ({ userVideos, className = "mt-24 pb-24" }) => {
  const navigate = useNavigate();

  if (!userVideos || userVideos.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-20 text-on-surface-variant font-mono text-sm">
        No archives found.
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 ${className}`}>
      <h2 className="text-2xl font-syne font-bold text-white border-b border-white/10 pb-4 mb-8">
        Featured Archives
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => navigate(`/videos/${video.id}`, { state: video })}
            className="group relative aspect-[9/16] w-full rounded-2xl overflow-hidden cursor-pointer bg-surface-container border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-[0_0_40px_rgba(208,188,255,0.15)]"
          >
            {/* Video Thumbnail (Using poster or video first frame) */}
            <video
              src={video.video_url}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content Container */}
            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              
              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                  <FiPlay /> {Math.floor(Math.random() * 100) + 1}k
                </span>
                <span className="bg-error/20 border border-error/30 text-error text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                  Must Watch
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-syne font-bold text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              
              {/* Hashtags */}
              {video.hashtags && video.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {video.hashtags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs text-on-surface-variant font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

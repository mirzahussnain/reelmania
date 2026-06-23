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

      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
        <h2 className="text-2xl md:text-3xl font-syne font-bold text-on-surface">Featured Archives</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userVideos.map((video, index) => (
          <div
            key={video.id}
            onClick={() => navigate(`/videos/${video.id}`, { state: video })}
            className={`card-glass-panel rounded-xl overflow-hidden group cursor-pointer aspect-[9/16] relative flex flex-col justify-end transition-transform duration-500 hover:-translate-y-2 hover:glow-primary-lg border border-white/5 hover:border-primary/50 ${index === 2 ? 'md:hidden lg:flex' : ''}`}
          >
            {/* Video Thumbnail (Using poster or video first frame) */}
            <video
              src={video.video_url}
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>

            {/* Content Container */}
            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">

              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-surface-container backdrop-blur-md border border-outline-variant/20 text-on-media text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
                  <FiPlay /> {Math.floor(Math.random() * 100) + 1}k
                </span>
                <span className="bg-error/20 border border-error/30 text-error text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                  Must Watch
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-syne font-bold text-on-media line-clamp-2 leading-tight group-hover:text-primary transition-colors">
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

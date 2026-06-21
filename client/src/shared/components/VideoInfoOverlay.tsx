import React, { useState } from "react";
import { Link } from "react-router-dom";
import { dateFormatter } from "../../utils/functions/formatter";
import { VideoType } from "../../types";
import { cn } from "../utils/cn";

interface VideoInfoOverlayProps {
  video: VideoType;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="absolute left-4 bottom-16 lg:bottom-10 w-[calc(100%-5rem)] lg:w-[calc(100%-6rem)] flex flex-col justify-end items-start z-20 pointer-events-none">
      
      <div className="w-full relative">
        <h2 className="flex flex-wrap items-center gap-2 font-semibold text-white drop-shadow-md pointer-events-auto">
          <Link to={`/users/@${video?.uploaded_by?.username}`} className="hover:underline text-lg">
            @{video?.uploaded_by?.username}
          </Link>
          <span className="text-zinc-200 text-sm font-medium">
            • {dateFormatter(new Date(video?.uploaded_at))}
          </span>
        </h2>
        
        <div className="w-full relative pointer-events-auto mt-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={cn(
            "w-full text-sm text-white drop-shadow-md transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[40vh] overflow-y-auto" : "max-h-6 overflow-hidden"
          )}>
            <p className={cn("mr-12", !isExpanded && "line-clamp-1")}>{video?.title}</p>
            
            {/* Hashtags display only when expanded or part of the flow */}
            <div className={cn(
              "flex flex-wrap items-center gap-2 transition-all duration-300 ease-in-out origin-top",
              isExpanded ? "opacity-100 scale-y-100 mt-2 h-auto" : "opacity-0 scale-y-0 h-0 overflow-hidden"
            )}>
              {video.hashtags.map((hashtag, index) => (
                <span className="font-semibold text-xs drop-shadow-md" key={index}>
                  #{hashtag}
                </span>
              ))}
            </div>
          </div>
          
          <button 
            className="absolute bottom-0 right-0 font-bold text-sm text-white drop-shadow-md bg-transparent px-1 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "less" : "more"}
          </button>
        </div>
      </div>
      
    </section>
  );
};

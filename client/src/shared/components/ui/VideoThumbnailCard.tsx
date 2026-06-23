import React from "react";
import { Link } from "react-router-dom";
import { VideoType } from "../../../types";
import { dateFormatter } from "../../../utils/functions/formatter";
import { cn } from "../../utils/cn";

// Card for REAL videos. `grid` is the Explore/discovery card (author overlay,
// hover-to-play); `vault` is the owner's archive card (badges + title). The
// Featured Archives / Collections grid is intentionally a separate component —
// it represents collections, not individual videos, and is not yet modelled.
type VideoCardVariant = "grid" | "vault";

interface VideoThumbnailCardProps {
  video: VideoType;
  variant?: VideoCardVariant;
  /** Position in the list — drives the "NEW" badge on the vault variant. */
  index?: number;
  onClick?: () => void;
  className?: string;
}

export const VideoThumbnailCard: React.FC<VideoThumbnailCardProps> = ({
  video,
  variant = "grid",
  index = 0,
  onClick,
  className,
}) => {
  if (variant === "vault") {
    return (
      <div
        onClick={onClick}
        className={cn("card-solid relative aspect-[9/16] overflow-hidden group cursor-pointer", className)}
      >
        <video
          src={video.video_url}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Duration Badge — duration not captured at upload yet. */}
        <div className="absolute top-3 right-3 bg-media-scrim backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-jetbrains font-bold text-on-media">
          --:--
        </div>

        {/* NEW Badge */}
        {index === 0 && (
          <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md border border-primary px-2 py-1 rounded-md text-[10px] font-jetbrains font-bold text-primary glow-primary-sm">
            NEW
          </div>
        )}

        {/* Title on hover */}
        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="font-bold text-sm text-on-media line-clamp-1">{video.title || "Untitled"}</p>
        </div>
      </div>
    );
  }

  // variant === "grid"
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-solid w-full aspect-[9/16] rounded-xl duration-700 transition-all cursor-pointer relative group overflow-hidden hover:scale-[1.02]",
        className
      )}
    >
      <video
        className="w-full h-full object-cover"
        src={video?.video_url}
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => e.currentTarget.pause()}
        muted
      />
      <div className="absolute bottom-2 right-0 left-4 w-full flex flex-col items-start justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
        <div className="w-full flex justify-start items-center text-on-media">
          <Link
            to={`/users/@${video?.uploaded_by?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-lg font-medium tracking-wider text-on-media hover:underline"
          >
            @{video?.uploaded_by?.username}
          </Link>
          <p className="mx-1">.</p>
          <span className="text-xs text-on-media-dim">
            {dateFormatter(new Date(video?.uploaded_at))}
          </span>
        </div>
        <h2 className="text-sm tracking-wide text-on-media font-thin">{video?.title}</h2>
        <span className="w-full flex justify-start items-center text-on-media">
          {video?.hashtags?.map((hashtag, idx) => (
            <p key={idx} className="mr-1">#{hashtag}</p>
          ))}
        </span>
      </div>
    </div>
  );
};

export default VideoThumbnailCard;

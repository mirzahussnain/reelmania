import React from "react";
import { Link } from "react-router-dom";
import { VideoType } from "../../../types";
import { cn } from "../../utils/cn";
import { FiShoppingCart } from "react-icons/fi";
import { Button } from "./Button";
import { CurateButton } from "../collections/CurateButton";
import { MOCK_VIDEO_METADATA } from "../../constants/mocks";

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
  const mockData = MOCK_VIDEO_METADATA[index % 4];
  // Only shorts with a linked DigitalAsset show format badges + a cart.
  const asset = mockData.asset;

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-solid w-full aspect-[9/16] rounded-md duration-700 transition-all cursor-pointer relative group overflow-hidden hover:scale-[1.02]",
        className
      )}
    >
      <video
        className="w-full h-full object-cover"
        src={video?.video_url}
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => e.currentTarget.pause()}
        muted
        playsInline
      />
      
      {/* Top Gradient for Duration */}
      <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-scrim/60 to-transparent pointer-events-none" />

      {/* Curate (add to collection) — applies to any video, not just assets */}
      <CurateButton
        videoId={video?.id}
        className="absolute top-3 left-3 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-media-scrim backdrop-blur-md border border-hairline/20 text-on-media hover:text-primary pointer-events-auto z-10 text-[13px]"
      />
      
      {/* Duration Badge */}
      <div className="absolute top-3 right-3 bg-primary/10 border border-primary/20 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-jetbrains font-bold text-primary flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
        {mockData.duration}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/20 to-transparent pointer-events-none" />

      <div className="absolute bottom-3 right-3 left-3 flex flex-col items-start justify-end pointer-events-none">
        <h2 className="text-sm md:text-base tracking-wide text-on-media font-bold line-clamp-1 uppercase font-syne mb-1 drop-shadow-lg">
          {video?.title || "UNTITLED_ASSET"}
        </h2>
        
        {/* Asset format badges — only when this short has a linked asset. */}
        {asset && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {asset.formats.map((tag, idx) => (
              <span key={idx} className="bg-primary/10 backdrop-blur-sm border border-primary/20 px-1.5 py-0.5 rounded md:rounded-md text-[8px] md:text-[9px] font-jetbrains font-bold text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="w-full flex justify-between items-end">
          <div className="flex flex-col">
            <Link
              to={`/users/@${video?.uploaded_by?.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] md:text-xs font-semibold tracking-wider text-on-media-dim hover:text-primary transition-colors line-clamp-1"
            >
              @{video?.uploaded_by?.username}
            </Link>
            <span className="text-[9px] md:text-[10px] font-jetbrains text-on-surface-variant mt-0.5">
              {mockData.views} views
            </span>
          </div>

          {/* Cart + price — only when a DigitalAsset is linked to this short. */}
          {asset && (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="text-[10px] md:text-xs font-jetbrains font-bold text-primary">${asset.priceUsd}</span>
              <Button
                variant="unstyled"
                aria-label="Add asset to cart"
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center transition-all group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: deep-link to the asset in Marketplace / add to cart.
                }}
              >
                <FiShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary transition-colors" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoThumbnailCard;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { dateFormatter } from "../../utils/functions/formatter";
import { VideoType } from "../../types";
import { cn } from "../utils/cn";
import { FiShoppingBag } from "react-icons/fi";
import { AvatarConnectBadge } from "./AvatarConnectBadge";
import { Button } from "./ui/Button";
import { useGetUserProfileQuery, useUpdateUserFollowerMutation, useCheckUserFollowerQuery } from "../../utils/store/features/user/userApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { toast } from "react-toastify";
import { AUTH_REQUIRED } from "../constants/messages";

interface VideoInfoOverlayProps {
  video: VideoType;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { user, token } = useCurrentUser();

  // Dynamically fetch the uploader's profile to get their Clerk avatar
  const { data: uploaderProfile } = useGetUserProfileQuery(video?.uploaded_by?.id, {
    skip: !video?.uploaded_by?.id
  });

  // Efficient O(1) lookup to check if current user follows the uploader
  const { data: checkFollowerData } = useCheckUserFollowerQuery(
    { followingId: video?.uploaded_by?.id, followerId: user?.id },
    {
      skip: !video?.uploaded_by?.id || !user?.id,
      // Revalidate on mount so follow state set on another page (e.g. the
      // profile) is reflected here without a hard refresh.
      refetchOnMountOrArgChange: true,
    }
  );

  const [followUser] = useUpdateUserFollowerMutation();

  const isOwnProfile = Boolean(user?.id && video?.uploaded_by?.id && user.id === video.uploaded_by.id);
  const isFollowing = Boolean(checkFollowerData?.data?.isFollowing);

  const handleConnect = async () => {
    try {
      if (!token || !user?.id) {
        toast.info(AUTH_REQUIRED.follow);
        return;
      }
      if (!video?.uploaded_by?.id) return;

      await followUser({
        followerId: user.id,
        followingId: video.uploaded_by.id,
        token,
      }).unwrap();
      
    } catch {
      toast.error("Failed to connect. Please try again.");
    }
  };

  return (
    <section className="absolute left-4 bottom-6 lg:bottom-6 w-[calc(100%-5rem)] lg:w-[calc(100%-6rem)] flex flex-col justify-end items-start z-20 pointer-events-none">
      
      <div className="w-full relative">
        
        <div className="flex items-center gap-3 pointer-events-auto mb-2">
          {/* Reusable Avatar Connect Badge */}
          <AvatarConnectBadge
            username={video?.uploaded_by?.username || "Unknown"}
            avatarUrl={uploaderProfile?.data?.avatar_url}
            sizeClassName="w-12 h-12 text-lg"
            onConnect={handleConnect}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            canConnect={Boolean(token && user?.id)}
          />

          <div className="flex flex-col justify-center">
            <Link to={`/users/@${video?.uploaded_by?.username}`} className="hover:underline text-lg font-bold text-on-media drop-shadow-md font-[family-name:var(--font-inter)] leading-tight">
              @{video?.uploaded_by?.username}
            </Link>
            
            <span className="text-on-media-dim text-xs font-medium drop-shadow-md font-[family-name:var(--font-inter)]">
              {dateFormatter(new Date(video?.uploaded_at))}
            </span>
          </div>
        </div>
        
        <div className="w-full relative pointer-events-auto mt-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={cn(
            "w-full drop-shadow-md transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-[40vh] overflow-y-auto" : "max-h-16 overflow-hidden"
          )}>
            <h1 className={cn("text-on-media font-[family-name:var(--font-inter)] font-semibold text-base mb-1", !isExpanded && "line-clamp-1")}>
              {video?.title}
            </h1>
            
            {/* Using hashtags as the description block for now */}
            <div className={cn(
              "flex flex-wrap items-center gap-2 transition-all duration-300 ease-in-out font-[family-name:var(--font-inter)] text-on-media-dim",
              isExpanded ? "opacity-100 scale-y-100 mt-1 h-auto" : "opacity-0 scale-y-0 h-0 overflow-hidden"
            )}>
              {video.hashtags.map((hashtag, index) => (
                <span className="font-semibold text-xs drop-shadow-md" key={index}>
                  #{hashtag}
                </span>
              ))}
            </div>
          </div>
          
          <Button
            variant="unstyled"
            className="absolute bottom-0 right-0 font-bold text-sm text-on-media drop-shadow-md bg-transparent px-1 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "less" : "more"}
          </Button>
        </div>

        {/* Marketplace Asset Link */}
        <div className="mt-2 pointer-events-auto flex items-center">
          <Button variant="unstyled" className="flex items-center gap-1.5 backdrop-blur-md border border-outline-variant/50 hover:border-primary/60 text-on-media-dim text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-md group" style={{ background: 'var(--color-media-scrim)' }}>
            <FiShoppingBag className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <span>Project File • $5.00</span>
          </Button>
        </div>
      </div>
      
    </section>
  );
};

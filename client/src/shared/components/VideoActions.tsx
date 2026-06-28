import React from "react";
import { FaHeart } from "react-icons/fa";
import { BiCommentDetail, BiSolidCommentDetail, BiShareAlt } from "react-icons/bi";
import { toast } from "react-toastify";
import Share from "../../components/Share";
import { VideoLikes, userType, VideoType } from "../../types";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";
import { CurateButton } from "./collections/CurateButton";

interface VideoActionsProps {
  video: VideoType;
  videoId: string;
  likes: VideoLikes[] | undefined;
  commentsLength: number;
  handleLikes: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  pending: boolean;
  user: userType;
  token: string | null;
  setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void;
  openShareModel: boolean;
  setOpenShareModel: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  video, videoId, likes, commentsLength, handleLikes,
  pending, user, token, setIsModalOpen, openShareModel, setOpenShareModel,
}) => {
  return (
    <div className="absolute right-3 bottom-16 lg:bottom-10 flex flex-col items-center gap-5 z-20">

      {/* Like Button */}
      <Button
        variant="unstyled"
        className="flex flex-col items-center group transition-transform hover:scale-105"
        onClick={handleLikes}
        type="button"
      >
        <div className="action-circle group-hover:scale-110">
          <FaHeart
            className={cn(
              "text-[22px] transition-colors",
              likes?.some((like) => like.liked_by.id == user?.id)
                ? "text-tertiary drop-shadow-[0_0_10px_var(--color-tertiary)]"
                : "text-on-media"
            )}
          />
        </div>
        <span className="text-on-media font-bold text-[13px] tracking-wide drop-shadow-md mt-1">
          {pending ? "..." : likes?.length || 0}
        </span>
      </Button>

      {/* Comment Button */}
      <Button
        variant="unstyled"
        data-comment-btn="true"
        className="flex flex-col items-center group transition-transform hover:scale-105"
        onClick={() => token ? setIsModalOpen({ isOpen: true }) : toast.error("Sign In Required")}
      >
        <div className="action-circle group-hover:scale-110">
          {commentsLength >= 1 ? (
            <BiSolidCommentDetail className="text-[26px] text-on-media drop-shadow-sm" />
          ) : (
            <BiCommentDetail className="text-[26px] text-on-media drop-shadow-sm" />
          )}
        </div>
        <span className="text-on-media font-bold text-[13px] tracking-wide drop-shadow-md mt-1">
          {commentsLength}
        </span>
      </Button>

      {/* Share Button */}
      <div className="relative flex flex-col items-center group">
        <Button
          variant="unstyled"
          className="flex flex-col items-center transition-transform hover:scale-105"
          onClick={() => setOpenShareModel(!openShareModel)}
        >
          <div className="action-circle group-hover:scale-110">
            <BiShareAlt className="text-[26px] text-on-media drop-shadow-sm" />
          </div>
          <span className="text-on-media font-bold text-[13px] tracking-wide drop-shadow-md mt-1">
            Share
          </span>
        </Button>

        {openShareModel && (
          <div className="absolute bottom-16 right-10 z-50">
            <Share videoId={videoId} />
          </div>
        )}
      </div>

      {/* Curate (add to collection) */}
      <CurateButton
        video={video}
        className="action-circle bg-media-scrim-lg hover:scale-110 text-[22px] text-on-media drop-shadow-sm"
      />

    </div>
  );
};

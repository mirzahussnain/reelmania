import React from "react";
import { FaCommentDots, FaHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Share from "../../components/Share";
import { VideoLikes } from "../../types";
import { cn } from "../utils/cn";

interface VideoActionsProps {
  videoId: string;
  likes: VideoLikes[] | undefined;
  commentsLength: number;
  handleLikes: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  pending: boolean;
  user: any;
  token: string | null;
  setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void;
  openShareModel: boolean;
  setOpenShareModel: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  videoId,
  likes,
  commentsLength,
  handleLikes,
  pending,
  user,
  token,
  setIsModalOpen,
  openShareModel,
  setOpenShareModel,
}) => {
  return (
    <div className="absolute right-4 bottom-24 lg:bottom-12 flex flex-col items-center gap-6 z-20">
      <button 
        className="flex flex-col items-center group transition-transform hover:scale-110" 
        onClick={handleLikes} 
        type="button"
      >
        <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 group-hover:bg-black/60 transition-colors">
          <FaHeart
            className={cn(
              "text-2xl transition-colors",
              likes?.some((like) => like.liked_by.id == user?.id) 
                ? "text-tertiary-container shadow-[0_0_15px_rgba(255,82,92,0.5)]" 
                : "text-white"
            )}
          />
        </div>
        <span className="text-white font-semibold text-sm drop-shadow-md mt-1">
          {pending ? "..." : likes?.length}
        </span>
      </button>

      <button
        className="flex flex-col items-center group transition-transform hover:scale-110"
        onClick={() => token ? setIsModalOpen({ isOpen: true }) : toast.error("Sign In Required")}
      >
        <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 group-hover:bg-black/60 transition-colors">
          <FaCommentDots className="text-2xl text-white" />
        </div>
        <span className="text-white font-semibold text-sm drop-shadow-md mt-1">
          {commentsLength}
        </span>
      </button>

      <div className="relative flex flex-col items-center group">
        <button
          className="flex flex-col items-center transition-transform hover:scale-110"
          onClick={() => setOpenShareModel(!openShareModel)}
        >
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 group-hover:bg-black/60 transition-colors">
            <FiShare2 className="text-2xl text-white" />
          </div>
          <span className="text-white font-semibold text-sm drop-shadow-md mt-1">
            Share
          </span>
        </button>
        
        {openShareModel && (
          <div className="absolute bottom-16 right-10 z-50">
            <Share videoId={videoId} />
          </div>
        )}
      </div>
    </div>
  );
};

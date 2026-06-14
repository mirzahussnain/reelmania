import React from "react";
import { FaCommentDots, FaHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Share from "../../components/Share";
import { VideoLikes } from "../../types";

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
    <div className="w-[4rem] lg:w-[3rem] lg:h-full flex flex-col items-center justify-center lg:static absolute right-0 bottom-24 text-white font-semibold lg:px-2">
      <button className="flex flex-col items-center justify-center" onClick={handleLikes} type="button">
        <FaHeart
          className={`text-3xl ${
            likes?.some((like) => like.liked_by.id == user?.id) ? "text-red-600" : "text-white"
          }`}
        />
        <span className="text-center text-sm text-white">
          {pending ? "..." : likes?.length}
        </span>
      </button>
      <button
        className="flex flex-col items-center justify-center mt-5"
        onClick={() => {
          return token ? setIsModalOpen({ isOpen: true }) : toast.error("Sign In Required");
        }}
      >
        <FaCommentDots className="text-3xl" />
        <span className="text-center text-sm">{commentsLength}</span>
      </button>
      <div className="relative">
        <button
          className="flex flex-col items-center justify-center mt-5"
          onClick={() => {
            return openShareModel ? setOpenShareModel(false) : setOpenShareModel(true);
          }}
        >
          <FiShare2 className="text-3xl" />
          <span className="text-center text-sm">Share</span>
        </button>
        {openShareModel && (
          <div className="absolute bottom-7 right-10">
            <Share videoId={videoId} />
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { IoFilter } from "react-icons/io5";
import { FaX } from "react-icons/fa6";
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from "react-icons/io";
import { ThreeDots } from "react-loader-spinner";
import { VideoType } from "../types";
import { formatNumber } from "../utils/functions/formatter";
import { useComments } from "../shared/hooks/useComments";
import { CommentItem } from "../shared/components/CommentItem";
import { CommentForm } from "../shared/components/CommentForm";

const Comments = ({
  video,
  setIsModalOpen,
}: {
  video: VideoType;
  setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void;
}) => {
  const {
    user,
    commentText,
    setCommentText,
    videoComments,
    pending,
    filter,
    setFilter,
    handleSumbit,
  } = useComments(video);

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="w-full shrink-0 h-14 px-5 flex justify-between items-center text-on-surface border-b border-white/10 bg-surface-container/50">
        <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          Comments
          <span className="text-sm font-normal text-on-surface-variant bg-white/5 px-2 py-0.5 rounded-full">
            {formatNumber(videoComments?.length || 0)}
          </span>
        </h2>
        <div className="flex items-center gap-4">
          <button
            className={`text-xl flex items-center justify-center transition-colors hover:text-primary ${
              filter ? "text-primary shadow-[0_0_10px_rgba(208,188,255,0.4)]" : "text-on-surface-variant"
            }`}
            onClick={() => setFilter((prev) => !prev)}
            title="Sort Comments"
          >
            <IoFilter /> {filter ? <IoIosArrowRoundUp /> : <IoIosArrowRoundDown />}
          </button>
          <button
            className="text-lg text-on-surface-variant hover:text-error transition-colors"
            onClick={() => setIsModalOpen({ isOpen: false })}
          >
            <FaX />
          </button>
        </div>
      </div>

      {/* Comment List */}
      <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-start transition-all">
        {pending && videoComments.length === 0 ? (
          <div className="mt-10"><ThreeDots color="#d0bcff" /></div>
        ) : videoComments?.length > 0 ? (
          videoComments.map((comment, index) => (
            <CommentItem key={index} comment={comment} />
          ))
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/50">
            <span className="text-4xl mb-2">✨</span>
            <p className="text-sm">Be the first to leave a glowing comment!</p>
          </div>
        )}
      </div>

      {/* Form */}
      <CommentForm 
        user={user}
        commentText={commentText}
        setCommentText={setCommentText}
        handleSumbit={handleSumbit}
      />
    </div>
  );
};

export default React.memo(Comments, (prevProps, nextProps) => {
  return prevProps.video.id === nextProps.video.id;
});
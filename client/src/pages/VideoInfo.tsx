import { useState } from "react";
import { FaCommentDots, FaHeart, FaChevronLeft } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { IoFilter } from "react-icons/io5";
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from "react-icons/io";
import { dateFormatter, formatNumber } from "../utils/functions/formatter";
import { useVideoDetails } from "../shared/hooks/useVideoDetails";
import { useVideoLikes } from "../shared/hooks/useVideoLikes";
import { useFollow } from "../shared/hooks/useFollow";
import { useComments } from "../shared/hooks/useComments";
import { CommentItem } from "../shared/components/CommentItem";
import { CommentForm } from "../shared/components/CommentForm";
import { cn } from "../shared/utils/cn";
import { Button } from "../shared/components/ui/Button";
import { Sheet } from "../shared/components/ui/Sheet";
import { CurateButton } from "../shared/components/collections/CurateButton";

const VideoInfo = () => {
  const navigateTo = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const {
    videoState,
    videoUser,
    user: currentUser,
    isSignedIn,
    videoRef,
    canvasRef,
  } = useVideoDetails();

  const { likes } = useVideoLikes(videoState?.id);
  const { followStatus, handleFollow } = useFollow(videoState?.uploaded_by?.id);

  const {
    user: commentUser,
    commentText,
    setCommentText,
    videoComments,
    filter,
    setFilter,
    handleSumbit
  } = useComments(videoState);

  if (!videoState) return null;

  // Info + comments panel — reused as the desktop sidebar and, on mobile, as the
  // body of the bottom-sheet opened by the floating button over the video.
  const infoPanel = (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Metadata Block */}
      <div className="w-full p-5 border-b border-outline-variant/20 bg-surface-container-highest/30 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <Link to={`/users/@${videoState.uploaded_by?.username}`} className="flex items-center gap-3 group">
            <img
              src={videoUser?.data?.avatar_url || "/default-avatar.png"}
              alt="user"
              className="w-12 h-12 rounded-full object-cover border border-outline-variant/30 group-hover:border-primary transition-colors"
            />
            <div className="flex flex-col">
              <h2 className="text-on-surface font-semibold text-lg group-hover:underline">
                @{videoState.uploaded_by?.username}
              </h2>
              <span className="text-on-surface-variant text-xs">
                {dateFormatter(new Date(videoState.uploaded_at))}
              </span>
            </div>
          </Link>

          {videoUser?.data?.id !== currentUser?.id && (
            <Button
              variant="unstyled"
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-bold transition-all",
                followStatus
                  ? "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20"
                  : "bg-primary text-on-primary hover:bg-primary-container hover:glow-primary"
              )}
              onClick={isSignedIn ? handleFollow : () => navigateTo("/sign-in")}
            >
              {followStatus ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        <p className="text-on-surface text-[15px] mb-2 leading-relaxed">{videoState.title}</p>
        <div className="flex flex-wrap gap-2">
          {videoState.hashtags?.map((tag, idx) => (
            <span key={idx} className="text-primary text-sm font-medium">#{tag}</span>
          ))}
        </div>

        {/* Reaction Stats */}
        <div className="flex items-center gap-6 mt-4 text-on-surface-variant">
          <div className="flex items-center gap-2">
            <FaHeart className="text-lg text-tertiary-container" />
            <span className="font-semibold text-on-surface">{formatNumber(likes?.length || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCommentDots className="text-lg" />
            <span className="font-semibold text-on-surface">{formatNumber(videoComments?.length || 0)}</span>
          </div>
          <CurateButton
            video={videoState}
            label="Save"
            className="ml-auto gap-2 px-3 py-1.5 rounded-full border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/50"
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col bg-surface-container-lowest/50">
        <div className="sticky top-0 w-full flex justify-between items-center p-4 bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/20 z-10">
          <h3 className="text-on-surface font-semibold">Comments</h3>
          <Button
            variant="unstyled"
            className={cn(
              "text-xl transition-colors",
              filter ? "text-primary glow-primary rounded-full" : "text-on-surface-variant"
            )}
            onClick={() => setFilter((prev) => !prev)}
          >
            <div className="flex items-center"><IoFilter /> {filter ? <IoIosArrowRoundUp /> : <IoIosArrowRoundDown />}</div>
          </Button>
        </div>

        {videoComments?.length > 0 ? (
          videoComments.map((comment, index) => (
            <CommentItem key={index} comment={comment} />
          ))
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-on-surface-variant/50 min-h-[200px]">
            <h2 className="text-lg font-medium">No Comments Yet</h2>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Comment Form — always visible for signed-in users (owner included). */}
      {isSignedIn ? (
        <CommentForm
          user={commentUser}
          commentText={commentText}
          setCommentText={setCommentText}
          handleSumbit={handleSumbit}
        />
      ) : (
        <div className="w-full p-4 border-t border-outline-variant/20 bg-surface-container/50 backdrop-blur-md">
          <Button
            variant="unstyled"
            className="w-full py-3 bg-primary/20 text-primary font-semibold rounded-xl hover:bg-primary hover:text-on-primary transition-colors"
            onClick={() => navigateTo("/sign-in")}
          >
            Sign in to comment
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex justify-center bg-surface overflow-hidden relative">

      {/* Background Canvas Blur Effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-3xl scale-110 -z-10" />

      <div className="w-full max-w-[1200px] h-full flex bg-surface-container/30 backdrop-blur-3xl shadow-2xl relative z-10">

        {/* Close Button */}
        <Button
          variant="unstyled"
          className="absolute top-4 left-4 z-50 p-3 rounded-full bg-surface-container/50 backdrop-blur-md text-on-surface hover:text-primary hover:bg-surface-container transition-colors border border-outline-variant/30"
          onClick={() => window.history.back()}
        >
          <FaX />
        </Button>

        {/* Video Player Section — full screen on mobile, left pane on desktop. */}
        <div className="flex-1 h-full bg-surface-container-lowest/80 flex items-center justify-center relative lg:border-r border-outline-variant/20 shadow-inner">
          <video
            id="video"
            ref={videoRef}
            className="w-full h-full lg:max-w-[400px] object-cover lg:rounded-xl glow-black"
            src={videoState.video_url}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
          />

          {/* Mobile: right-edge handle tab that opens the info + comments sheet. */}
          <Button
            variant="unstyled"
            aria-label="Show info and comments"
            className="lg:hidden absolute top-1/2 -translate-y-1/2 right-0 z-40 flex items-center gap-1.5 pl-4 pr-2.5 py-4 rounded-l-full bg-surface-container/80 backdrop-blur-md border border-r-0 border-outline-variant/30 text-on-surface hover:text-primary hover:bg-surface-container transition-colors shadow-lg"
            onClick={() => setShowInfo(true)}
          >
            <FaChevronLeft className="text-lg" />
            <FaCommentDots className="text-lg" />
          </Button>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-[450px] h-full bg-surface-container/80 backdrop-blur-xl border-l border-outline-variant/20">
          {infoPanel}
        </div>
      </div>

      {/* Mobile: info + comments as a full-screen panel sliding in from the right */}
      <Sheet
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        variant="right"
        hideBackdrop
        className="w-full bg-surface flex flex-col"
      >
        {/* Header with close button */}
        <div className="shrink-0 flex justify-between items-center h-14 px-4 border-b border-outline-variant/20 bg-surface-container">
          <h2 className="text-on-surface font-semibold">Info & Comments</h2>
          <Button
            variant="unstyled"
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            onClick={() => setShowInfo(false)}
          >
            <FaX />
          </Button>
        </div>
        <div className="flex-1 min-h-0">{infoPanel}</div>
      </Sheet>
    </div>
  );
};

export default VideoInfo;

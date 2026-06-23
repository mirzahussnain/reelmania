import { FaCommentDots, FaHeart } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { IoFilter } from "react-icons/io5";
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from "react-icons/io";
import { dateFormatter, formatNumber } from "../utils/functions/formatter";
import { useVideoInfo } from "../shared/hooks/useVideoInfo";
import { useComments } from "../shared/hooks/useComments";
import { CommentItem } from "../shared/components/CommentItem";
import { CommentForm } from "../shared/components/CommentForm";
import { cn } from "../shared/utils/cn";

const VideoInfo = () => {
  const navigateTo = useNavigate();
  const {
    videoState,
    videoUser,
    user: currentUser,
    likes,
    followStatus,
    isSignedIn,
    videoRef,
    canvasRef,
    handleFollow
  } = useVideoInfo();

  // Re-use the extremely clean hook we built for Phase 3!
  const {
    user: commentUser,
    commentText,
    setCommentText,
    videoComments,
    filter,
    setFilter,
    handleSumbit
  } = useComments(videoState as any);

  if (!videoState) return null;

  return (
    <div className="w-screen h-[100dvh] flex justify-center bg-surface overflow-hidden relative pt-[60px] lg:pt-0">
      
      {/* Background Canvas Blur Effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-3xl scale-110 -z-10" />

      <div className="w-full max-w-[1200px] h-full flex flex-col lg:flex-row bg-surface-container/30 backdrop-blur-3xl shadow-2xl relative z-10">
        
        {/* Close Button */}
        <button
          className="absolute top-4 left-4 z-50 p-3 rounded-full bg-surface-container/50 backdrop-blur-md text-on-surface hover:text-primary hover:bg-surface-container transition-colors border border-outline-variant/30"
          onClick={() => window.history.back()}
        >
          <FaX />
        </button>

        {/* Video Player Section */}
        <div className="flex-1 h-[40vh] lg:h-full bg-surface-container-lowest/80 flex items-center justify-center relative border-r border-outline-variant/20 shadow-inner">
          <video
            id="video"
            ref={videoRef}
            className="w-full h-full lg:max-w-[400px] object-cover rounded-xl glow-black"
            src={videoState.video_url}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
          />
        </div>

        {/* Sidebar Info & Comments Section */}
        <div className="w-full lg:w-[450px] h-[60vh] lg:h-full flex flex-col bg-surface-container/80 backdrop-blur-xl border-l border-outline-variant/20 relative">
          
          {/* Metadata Block */}
          <div className="w-full p-5 border-b border-outline-variant/20 bg-surface-container-highest/30 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <Link to={`/users/@${videoState.uploaded_by?.username}`} className="flex items-center gap-3 group">
                <img
                  src={videoUser?.body?.avatar_url || "/default-avatar.png"}
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

              {videoUser?.body?.id !== currentUser?.id && (
                <button
                  className={cn(
                    "px-5 py-1.5 rounded-full text-sm font-bold transition-all",
                    followStatus 
                      ? "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20" 
                      : "bg-primary text-on-primary hover:bg-primary-container hover:glow-primary"
                  )}
                  onClick={isSignedIn ? handleFollow : () => navigateTo("/sign-in")}
                >
                  {followStatus ? "Following" : "Follow"}
                </button>
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
            </div>
          </div>

          {/* Comments List */}
          <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col bg-surface-container-lowest/50">
            <div className="sticky top-0 w-full flex justify-between items-center p-4 bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/20 z-10">
              <h3 className="text-on-surface font-semibold">Comments</h3>
              <button
                className={cn(
                  "text-xl transition-colors",
                  filter ? "text-primary glow-primary rounded-full" : "text-on-surface-variant"
                )}
                onClick={() => setFilter((prev) => !prev)}
              >
                <div className="flex items-center"><IoFilter /> {filter ? <IoIosArrowRoundUp /> : <IoIosArrowRoundDown />}</div>
              </button>
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

          {/* Comment Form */}
          {isSignedIn ? (
            videoState.uploaded_by?.id !== currentUser?.id && (
              <CommentForm
                user={commentUser}
                commentText={commentText}
                setCommentText={setCommentText}
                handleSumbit={handleSumbit}
              />
            )
          ) : (
            <div className="w-full p-4 border-t border-outline-variant/20 bg-surface-container/50 backdrop-blur-md">
              <button
                className="w-full py-3 bg-primary/20 text-primary font-semibold rounded-xl hover:bg-primary hover:text-on-primary transition-colors"
                onClick={() => navigateTo("/sign-in")}
              >
                Sign in to comment
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VideoInfo;

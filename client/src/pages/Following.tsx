import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiUserPlus, FiCompass } from "react-icons/fi";
import { useInView } from "react-intersection-observer";
import PlayerCard from "../components/PlayerCard";
import Comments from "../components/Comments";
import Loader from "../components/Loader";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useFollowingFeed } from "../shared/hooks/useFollowingFeed";
import { Button } from "../shared/components/ui/Button";

/**
 * Following feed — videos from the creators the signed-in user follows
 * (uploaded_by.id ∈ my following set), newest first.
 *
 * Auth-gated via routes.config (`access: "auth"`). When the user follows no one
 * (or those creators have no videos yet) we show an honest empty state instead
 * of a blank feed.
 */
const Following = () => {
  const navigateTo = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { videos, isLoading, isFetching, hasMore } = useFollowingFeed(inView);
  const screenWidth = useScreenWidth();

  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const commentsTrayRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const container = e.currentTarget;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    if (idx !== activeVideoIndex && idx >= 0 && idx < (videos?.length || 0)) {
      setActiveVideoIndex(idx);
    }
  };

  if (isLoading) return <Loader />;

  if (!videos || videos.length === 0) {
    return (
      <main className="w-full h-full flex flex-col items-center justify-center text-center px-6 bg-transparent">
        <div className="w-20 h-20 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6">
          <FiUserPlus className="text-4xl text-primary" />
        </div>

        <h1 className="text-2xl md:text-3xl font-syne font-bold text-on-surface mb-2">
          Your Following feed is empty
        </h1>
        <p className="text-on-surface-variant font-inter max-w-md mb-8">
          Sync with creators and their latest videos will show up here. Head to Discover
          to find people worth following.
        </p>

        <Button onClick={() => navigateTo("/discover")} className="flex items-center gap-2">
          <FiCompass className="text-lg" /> Discover creators
        </Button>
      </main>
    );
  }

  return (
    <main id="feed-container" onScroll={handleScroll} className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-transparent relative">
      {videos.map((video, index) => {
        const isLastVideo = index === videos.length - 1;
        return (
          <div
            ref={isLastVideo ? ref : null}
            className="w-full h-full flex justify-center items-center snap-start snap-always relative lg:py-6"
            key={video.id ?? index}
          >
            <motion.div
              initial={false}
              animate={{ x: screenWidth >= 1024 ? (isCommentsOpen ? "-15rem" : 0) : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full h-full lg:h-auto flex justify-center items-center"
            >
              <PlayerCard
                video={video}
                setIsModalOpen={({ isOpen }: { isOpen: boolean }) => setIsCommentsOpen(isOpen)}
              />
            </motion.div>
          </div>
        );
      })}

      {/* Comment sheet — portaled to <body> so it escapes the feed's z-10
          stacking context and can layer above the bottom navbar (z-50). */}
      {createPortal(
        <>
          {/* Mobile backdrop — dims the video behind the near-full-height sheet. */}
          <div
            onClick={() => setIsCommentsOpen(false)}
            className={`lg:hidden fixed inset-0 z-[59] bg-scrim/70 transition-opacity duration-300 ${isCommentsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          />

          <motion.div
            ref={commentsTrayRef}
            initial={false}
            animate={{
              x: screenWidth >= 1024 ? (isCommentsOpen ? "-20%" : "150%") : 0,
              y: screenWidth >= 1024 ? "calc(-50% + 40px)" : (isCommentsOpen ? "0%" : "100%"),
              opacity: isCommentsOpen ? 1 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // Mobile: near-full-height, more opaque than the glass default so text is
            // legible over the video; overflow-hidden clips children to the rounded top.
            style={screenWidth < 1024 ? { background: "color-mix(in srgb, var(--color-surface-container) 92%, transparent)" } : undefined}
            className={`fixed z-[60] w-full lg:w-[28rem] h-[92dvh] lg:h-[85dvh] bottom-0 lg:bottom-auto lg:top-1/2 right-0 card-glass lg:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl ${isCommentsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            {videos[activeVideoIndex] && (
              <Comments
                video={videos[activeVideoIndex]}
                setIsModalOpen={({ isOpen }: { isOpen: boolean }) => setIsCommentsOpen(isOpen)}
              />
            )}
          </motion.div>
        </>,
        document.body
      )}

      {isFetching && hasMore && (
        <div className="py-4 text-on-surface-variant">Loading more...</div>
      )}
    </main>
  );
};

export default Following;

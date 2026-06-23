import { useState, useRef } from "react";
import { motion } from "framer-motion";
import PlayerCard from "../components/PlayerCard";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import Loader from "../components/Loader";
import Comments from "../components/Comments";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useInView } from "react-intersection-observer";
import { useInfiniteFeed } from "../shared/hooks/useInfiniteFeed";
import { Button } from "../shared/components/ui/Button";

const Home = () => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { isLoading, isFetching, hasMore } = useInfiniteFeed(inView);

  const videos = useAppSelector((state: RootState) => state.video.forYouVideos);
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

  const scrollFeed = (direction: 'up' | 'down') => {
    const container = document.getElementById('feed-container');
    if (container) {
      container.scrollBy({
        top: direction === 'down' ? window.innerHeight : -window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  return isLoading ? (
    <Loader />
  ) : (
    <main id="feed-container" onScroll={handleScroll} className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-transparent relative">
      {videos?.length === 0 ? (
        <div className="text-xl tracking-wide w-full h-full flex flex-col justify-center items-center text-on-surface-variant">
          <span className="text-5xl mb-3">🔒</span>
          <span className="font-semibold text-center">Please sign in to build your customized Algorithm!<br/>Click "Explore" to view trending videos.</span>
        </div>
      ) : (
        videos.map((video, index) => {
          const isLastVideo = index === videos.length - 1;
          return (
            <div
              ref={isLastVideo ? ref : null}
              className="w-full h-full flex justify-center items-center snap-start snap-always relative lg:py-6"
              key={index}
            >
              {/* Video Player */}
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
        })
      )}

      {/* Global Comments Tray */}
      <motion.div
        ref={commentsTrayRef}
        initial={false}
        animate={{
          x: screenWidth >= 1024 ? (isCommentsOpen ? "-20%" : "150%") : 0,
          y: screenWidth >= 1024 ? "calc(-50% + 40px)" : (isCommentsOpen ? "0%" : "100%"),
          opacity: isCommentsOpen ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed z-[50] w-full lg:w-[28rem] h-[60dvh] lg:h-[85dvh] bottom-0 lg:bottom-auto lg:top-1/2 right-0 card-glass lg:rounded-2xl rounded-t-2xl shadow-2xl ${isCommentsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {videos && videos[activeVideoIndex] && (
          <Comments
            video={videos[activeVideoIndex]}
            setIsModalOpen={({ isOpen }: { isOpen: boolean }) => setIsCommentsOpen(isOpen)}
          />
        )}
      </motion.div>

      {/* Custom Neon Navigation Arrows */}
      <div className="fixed right-6 bottom-24 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto hidden lg:flex flex-col gap-4 z-[40]">
        <Button
          variant="unstyled"
          onClick={() => scrollFeed('up')}
          className="p-3 rounded-full card-glass text-on-surface-variant hover:text-on-surface hover:bg-primary/20 hover:border-primary/50 hover:glow-primary transition-all duration-300 group"
        >
          <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </Button>
        <Button
          variant="unstyled"
          onClick={() => scrollFeed('down')}
          className="p-3 rounded-full card-glass text-on-surface-variant hover:text-on-surface hover:bg-primary/20 hover:border-primary/50 hover:glow-primary transition-all duration-300 group"
        >
          <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </Button>
      </div>

      {isFetching && hasMore && (
        <div className="py-4 text-on-surface-variant">Loading more...</div>
      )}
    </main>
  );
};

export default Home;

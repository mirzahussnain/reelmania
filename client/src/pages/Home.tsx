import { useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import Loader from "../components/Loader";
import Comments from "../components/Comments";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { useInView } from "react-intersection-observer";
import { useInfiniteFeed } from "../shared/hooks/useInfiniteFeed";

const Home = () => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { isLoading, isFetching, hasMore } = useInfiniteFeed(inView);

  const videos = useAppSelector((state: RootState) => state.video.forYouVideos);
  const screenWidth = useScreenWidth();
  const [openVideoIndex, setOpenVideoIndex] = useState<number | null>(null);

  const scrollFeed = (direction: 'up' | 'down') => {
    const container = document.getElementById('feed-container');
    if (container) {
      const scrollAmount = window.innerHeight;
      container.scrollBy({
        top: direction === 'down' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return  isLoading ? (
    <Loader />
  ) : (
    <main id="feed-container" className="w-full h-dvh flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black relative">
      {videos?.length === 0 ? (
        <div className="text-xl tracking-wide w-full h-full flex flex-col justify-center items-center text-zinc-300">
          <span className="text-5xl mb-3">🔒</span>
          <span className="font-semibold text-center">Please sign in to build your customized Algorithm!<br/>Click "Explore" to view trending videos.</span>
        </div>
      ) : (
        videos.map((video: any, index) => {
          const isLastVideo = index === videos.length - 1;
          return (
          <div
            ref={isLastVideo ? ref : null}
            className="w-full h-dvh flex justify-center items-center snap-start relative lg:py-6"
            key={index}
          >
            {/* Video Player */}
            <div
              className={`w-full h-full lg:h-auto flex justify-center items-center transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                openVideoIndex === index
                  ? "lg:-translate-x-[15rem]"
                  : "lg:translate-x-0"
              }`}
            >
              <PlayerCard
                video={video}
                setIsModalOpen={({isOpen}:{isOpen:boolean}) =>
                  isOpen?setOpenVideoIndex(index):setOpenVideoIndex(null)
                }
              />
            </div>

            {/* Comments Container (TikTok/Reels Hybrid) */}
            <div
              className={`fixed z-[50] w-full lg:w-[28rem] h-[60dvh] lg:h-[90dvh] bottom-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 right-0 
                bg-surface-container/80 backdrop-blur-3xl lg:border lg:border-white/10 lg:rounded-2xl rounded-t-2xl lg:rounded-t-2xl shadow-2xl
                transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                openVideoIndex === index
                  ? screenWidth >= 1024
                    ? "translate-x-0 lg:-translate-x-[20%]" // Pops out to the side on desktop
                    : "translate-y-0" // Slides up from bottom on mobile
                  : screenWidth >= 1024
                  ? "translate-x-[150%] opacity-0"
                  : "translate-y-[100%] opacity-0"
              }`}
            >
              <Comments
                video={video}
                setIsModalOpen={({isOpen}:{isOpen:boolean}) =>
                  isOpen?setOpenVideoIndex(index):setOpenVideoIndex(null) 
                }
              />
            </div>
          </div>
        )})
      )}

      {/* Custom Neon Navigation Arrows */}
      <div className="fixed right-6 bottom-24 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto hidden lg:flex flex-col gap-4 z-[40]">
        <button 
          onClick={() => scrollFeed('up')}
          className="p-3 rounded-full bg-surface-container/50 backdrop-blur-md border border-white/10 text-white hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(208,188,255,0.4)] transition-all duration-300 group"
        >
          <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button 
          onClick={() => scrollFeed('down')}
          className="p-3 rounded-full bg-surface-container/50 backdrop-blur-md border border-white/10 text-white hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(208,188,255,0.4)] transition-all duration-300 group"
        >
          <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {isFetching && hasMore && <div className="py-4 text-white">Loading more...</div>}
    </main>
  );
};

export default Home;

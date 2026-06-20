import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { useAppDispatch, useAppSelector } from "../utils/hooks/storeHooks";
import {
  useLazyFetchForYouVideosQuery,
} from "../utils/store/features/video/videoApi";
import { RootState } from "../utils/store/store";
import { setForYouVideos, appendForYouVideos } from "../utils/store/features/video/videoSlice";
import Loader from "../components/Loader";
import Comments from "../components/Comments";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { toast } from "react-toastify";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@clerk/clerk-react";

const Home = () => {
  const { getToken, isSignedIn } = useAuth();
  const [fetchForYou, { isLoading: isForYouLoading, isFetching: isForYouFetching }] = useLazyFetchForYouVideosQuery();
  const [fetchAll, { isLoading: isAllLoading, isFetching: isAllFetching }] = useLazyFetchAllVideosQuery();

  const isLoading = isSignedIn ? isForYouLoading : isAllLoading;
  const isFetching = isSignedIn ? isForYouFetching : isAllFetching;

  const dispatch = useAppDispatch();
  const videos = useAppSelector((state: RootState) => state.video.forYouVideos);
  const screenWidth = useScreenWidth();
 
  const [openVideoIndex, setOpenVideoIndex] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
        if (!isSignedIn) {
          // Unauthenticated User -> Global Cached Feed (Like TikTok Guest Mode)
          fetchAll({}).unwrap().then((res) => {
            if (res?.videos) {
                dispatch(setForYouVideos(res.videos));
                setHasMore(res.videos.length > 0);
            }
          }).catch(() => toast.error("Failed to fetch trending videos"));
          return;
        }

        // Authenticated User -> Personalized Algorithm
        const token = await getToken();
        if (!token) return; 

        fetchForYou({ token }).unwrap().then((res) => {
        if (res?.videos) {
            dispatch(setForYouVideos(res.videos));
            setHasMore(res.videos.length > 0);
        }
        }).catch(() => toast.error("Failed to fetch personalized feed"));
    }
    loadInitial();
  }, [getToken, isSignedIn]);

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      const loadMore = async () => {
          if (!isSignedIn) {
             // Currently Explore Feed backend doesn't support cursor pagination the same way yet,
             // but we'll try to fetch next batch if supported.
             // For now, it will just load the same 20 unless the backend randomizes/caches it.
             // We can just rely on the first batch for guests, or fetch with offset if backend supports it.
             setHasMore(false); // Stop infinite scroll for guests to prevent loop of same videos for now
             return;
          }

          const token = await getToken();
          if (!token) return;

          fetchForYou({ token }).unwrap().then((res) => {
            if (res?.videos?.length > 0) {
              dispatch(appendForYouVideos(res.videos));
              setHasMore(true);
            } else {
              setHasMore(false);
            }
          }).catch(() => toast.error("Failed to fetch more videos"));
      }
      loadMore();
    }
  }, [inView, hasMore, isFetching, fetchForYou, fetchAll, dispatch, getToken, isSignedIn]);

  return  isLoading ? (
    <Loader />
  ) : (
    <main className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
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
            className="w-full h-full flex lg:justify-center snap-start lg:mt-5 lg:last:mb-20 lg:py-3"
            key={index}
          >
            {/* Video Player */}
            <div
              className={`w-full lg:w-[25rem] h-full transform transition-transform duration-300 ease-in-out ${
                openVideoIndex === index
                  ? "lg:-translate-x-20"
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

            {/* Comments Container */}
            <div
              className={`bg-zinc-900 lg:bg-transparent fixed z-[50] top-[7rem] lg:top-[4.6rem] right-0 lg:w-[30rem] w-full lg:h-[39rem] h-[90%] transform transition-transform duration-300 ease-in-out ${
                openVideoIndex === index
                  ? screenWidth >= 1024
                    ? "-translate-x-20"
                    : "-translate-y-10"
                  : screenWidth >= 1024
                  ? "translate-x-full"
                  : "translate-y-[200%]"
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
      {isFetching && hasMore && <div className="py-4 text-white">Loading more...</div>}
    </main>
  );
};

export default Home;

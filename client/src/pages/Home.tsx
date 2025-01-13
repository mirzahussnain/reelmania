import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { useAppDispatch, useAppSelector } from "../utils/hooks/storeHooks";
import {
  useFetchAllVideosQuery,
} from "../utils/store/features/video/videoApi";
import { RootState } from "../utils/store/store";
import { setAllVideos } from "../utils/store/features/video/videoSlice";
import Loader from "../components/Loader";
import Comments from "../components/Comments";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { toast } from "react-toastify";
const Home = () => {
  const { data, isLoading,isError} = useFetchAllVideosQuery({});

  const dispatch = useAppDispatch();
  const videos = useAppSelector((state: RootState) => state.video.videos);
  const screenWidth = useScreenWidth();
 
  const [openVideoIndex, setOpenVideoIndex] = useState<number | null>(null);
  useEffect(() => {
    if (data?.videos) {
      dispatch(setAllVideos(data.videos));
    }
    else if(isError){
        toast.error("Failed to fetch videos");
      
    }
  }, [data,dispatch]);



  return  isLoading ? (
    <Loader />
  ) : (
    <main className="w-full h-full flex flex-col items-center overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {videos?.length === 0 ? (
        <div className="text-xl tracking-wide w-full h-full flex flex-col justify-center items-center text-zinc-300">
          <span className="text-5xl mb-3">😔</span>
          <span className="font-semibold">No Video Exists in Database</span>
        </div>
      ) : (
        videos.map((video: any, index) => (
          <div
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
        ))
      )}
    </main>
  );
};

export default Home;

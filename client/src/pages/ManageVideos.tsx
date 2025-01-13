import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import VideoCard from "../components/VideoCard";
import UploadVideoModal from "../pages/UploadVideo";
import ReactModal from "react-modal";
import { useFetchUserVideosQuery } from "../utils/store/features/video/videoApi";
import { useAuth } from "@clerk/clerk-react";
import {  useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { VideoType } from "../types";
import Loader from "../components/Loader";


const ManageVideos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const user = useAppSelector((state: RootState) => state.user);
  const [userVideos, setUserVideos] = useState<VideoType[]>([]);
  const { data,isLoading } = useFetchUserVideosQuery(
    user?.id,
    {
      skip: !isSignedIn || !user?.id,
    }
  );
  ReactModal.setAppElement("#root");
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (data) {

      setUserVideos(data?.videos);
    }
  }, [data]);

  return isLoading?(<Loader/>):(

    <div className="w-full h-full flex items-start justify-center  lg:p-6 transition-all ease-in-out duration-75">
      <main className="w-full h-full lg:w-11/12 lg:h-[90%]  lg:rounded-2xl bg-zinc-700 lg:shadow-lg lg:shadow-slate-800">
        <div className="w-full h-full flex flex-col justify-center items-center text-white lg:static">
          <div
            className="w-full h-[3rem] flex justify-between items-center p-3 
              bg-gradient-to-r from-red-500/30 to-red-700 lg:rounded-t-2xl"
          >
            <h2 className="ml-6 mt-2 text-xl">All Your Videos</h2>
            <button
              className="rounded-full p-2 bg-red-500 hover:bg-red-700 text-white mr-3"
              onClick={openModal}
            >
              <FaPlus />
            </button>
          </div>

          {userVideos?.length > 0 ? (
            <div
              className="w-full h-full p-5 grid grid-cols-[repeat(auto-fill,_minmax(215px,_1fr))] gap-[0.4rem] overflow-y-auto
               scrollbar-custom max-lg:scrollbar-hide bg-gradient-to-br from-zinc-800/80 to-white/20 backdrop-filter backdrop-blur-2xl rounded-b-2xl "
            >
              {userVideos.map((userVideo, index) => (
                <VideoCard key={index} videoInfo={userVideo} />
              ))}
            </div>
          ) : (
            <div className="text-xl flex flex-col justify-center items-center h-full w-full text-zinc-300">
              <span className="text-5xl">😔</span>
              <h2 className="font-semibold">No Video Exists</h2>
              <span>Upload Videos To Stream</span>
            </div>
          )}
        </div>
      </main>
      <UploadVideoModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default ManageVideos;

import { FaRegTrashAlt } from "react-icons/fa";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";
import { VideoType } from "../types";
import {dateFormatter} from "../utils/functions/formatter.ts";
import { useDeleteUserVideoMutation } from "../utils/store/features/video/videoApi.ts";
import { useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import { toast } from "react-toastify";
import Loader from "./Loader.tsx";

const VideoCard = ({ videoInfo }: { videoInfo: VideoType }) => {
  const NavigateTo: NavigateFunction = useNavigate();
  const [deleteVideo,{isLoading}]=useDeleteUserVideoMutation();
  const token=useAppSelector((state:RootState)=>state.auth.token)
  const handleDeleteVideo=async(e: React.MouseEvent<HTMLButtonElement>)=>{
    e.stopPropagation();
    try{


      if(!token){
        toast.error("User not authenticated")
      }
      if(!videoInfo?.id){
        toast.error("Video Id is missing")
      }
      toast.info("Deleting Video...")
      const response=await deleteVideo(videoInfo?.id).unwrap();
     if(!isLoading){
      toast.success(response.message)
     }
      
    }catch(err){

      console.log(err)
    }
  }

 
  return isLoading?<Loader/>:(

    <div
      className="w-full h-[30rem] md:w-[15rem] md:h-[23rem]    last:mb-10 relative  lg:border-[1px] border-white/40 "
      onClick={() => NavigateTo(`/videos/${videoInfo?.id}`,{
        state:videoInfo
      })}
    >
      <video
        className="w-full h-full  object-fill hover:cursor-pointer"
        src={videoInfo?.video_url}
        muted
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => e.currentTarget.pause()}
      />
      <button className="  rounded-full absolute top-0 left-0 p-3 text-xl text-red-500 hover:text-red-400 z-50"
      onClick={(e)=>handleDeleteVideo(e)}
      type="button">
        <FaRegTrashAlt />
      </button>
      <div className="absolute left-0 bottom-2  w-full  flex flex-col justify-center items-start px-3">
        <h2 className="w-full font-semibold">
          <Link to={`/users/${videoInfo?.uploaded_by?.username}`} className="hover:underline mr-1">
            {videoInfo.uploaded_by?.username}
          </Link>
          .<span className="text-sm text-zinc-400 ml-1">{dateFormatter(new Date(videoInfo?.uploaded_at))}</span>
        </h2>
        <p className="w-full text-ellipsis text-nowrap overflow-hidden hover:text-wrap hover:overflow-y-auto peer">
          {videoInfo?.title}
        </p>
        <p className="text-sm flex items-center justify-start flex-wrap">
          {videoInfo?.hashtags?.map((hashtag,index) => (
            <span key={index} className="mr-1">{`#${hashtag}`}</span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;

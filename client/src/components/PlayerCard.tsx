import React, { useEffect, useRef, useState } from "react";
import { FaCommentDots, FaHeart } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { gsap } from "gsap";
import { Link} from "react-router-dom";
import { CommentType, VideoLikes, VideoType } from "../types";
import { dateFormatter } from "../utils/functions/formatter.ts";
import { useLazyGetCommentsByVideoIdQuery, useLazyGetLikesByVideoIdQuery, useUpdateLikesMutation } from "../utils/store/features/video/videoApi.ts";
import { useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import { connectSocket } from "../utils/functions/socket.ts";
import { toast } from "react-toastify";
import Share from "./Share.tsx";

const PlayerCard = ({
  video,
  setIsModalOpen,
}: {
  video: VideoType;
  setIsModalOpen: ({isOpen}:{isOpen:boolean})=>void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [getVideoLikes]=useLazyGetLikesByVideoIdQuery();
  const [getComments]=useLazyGetCommentsByVideoIdQuery();
  const [updateLikes] = useUpdateLikesMutation();
  const { token } = useAppSelector((state: RootState) => state.auth);
  const user = useAppSelector((state: RootState) => state.user);

  const [pending, setPending] = useState(false); 
  const [likes,setLikes] = useState<VideoLikes[]>();
  const socket = token ? connectSocket(token) : null;
  const [openShareModel,setOpenShareModel]=useState(false);
  const [comments,setComments]=useState<CommentType[]>([]);
  const handleLikes = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (!token || ! user) {
        toast.error("Sign In Required");
       
        return;
      }
      if (!video?.id) {
        toast.error("Video Id is missing");
        return;
      }
     

      // Start optimistic update: Set pending state and assume success
      setPending(true);

      const userData = { userId: user?.id, userName: user?.username };
      await updateLikes({ videoId: video.id, userData, token }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      setPending(false); // End the optimistic update
    }
  };


  useEffect(()=>{
    const fetchLikes=async(videoId:string)=>{
    try{
      if(videoId){
       const query=await getVideoLikes(videoId).unwrap();
       if(query && query?.likes){
        setLikes(query?.likes)
       }
      }
    }catch(err){
      console.log(err)
    }


  }
  const fetchComments=async(videoId:string)=>{
    try{
      if(videoId){
        const query=await getComments(videoId).unwrap();
        if(query && query?.comments){
          let videoComments=[...query?.comments];
         setComments(videoComments.sort((a,b)=>new Date(b.posted_at).getTime()-new Date(a.posted_at).getTime()));
        }
      }
    }catch(err){
      console.log(err)
    }
  }
  
      if(video?.id){
        fetchLikes(video.id);
        fetchComments(video.id);
      }
  },[])
  useEffect(() => {
    try { if (socket) {
        socket.connect();
      socket.on("likesChange", ({updatedLikes,videoId}) => {
        if (videoId == video?.id && updatedLikes) {
          setLikes(updatedLikes);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("likesChange");
        socket.disconnect();
    };
}}catch(err){
  if (err instanceof Error) {
    toast.error(err.message || "Socket Error");
  } else {
    toast.error("Socket Error");
  }
}
  }, [socket]);


  useEffect(() => {
    const handleUnmuteAllVideos = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      // Unmute all videos on the page
      const allVideos = document.querySelectorAll("video");
      if (!target.muted) {
        allVideos.forEach((video) => {
          video.muted = false;
          video.volume = target.volume;
        });
      } else {
        allVideos.forEach((video) => {
          video.muted = true;
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current.play();
            }
            gsap.to(videoRef.current, {
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
            });
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsModalOpen({isOpen:false});
            }
            gsap.to(videoRef.current, {
              opacity: 0.5,
              duration: 0.5,
              ease: "power1.out",
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
      videoRef.current.addEventListener("volumechange", handleUnmuteAllVideos);
    }

    // Cleanup observer
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
        videoRef.current.removeEventListener(
          "volumechange",
          handleUnmuteAllVideos
        );
      }
    };
  }, []);

  return (
    <div className="lg:static relative w-full lg:h-[88vh] h-[100vh] lg:rounded-l-2xl  lg:flex lg:justify-center transition-all ease-in-out duration-200  ">
      <div className="relative w-full lg:w-11/12 h-full lg:rounded-2xl ">
        <video
          ref={videoRef}
          className="w-full h-full object-fill lg:rounded-2xl  video-control-hide peer"
          autoPlay={false} // Controlled by intersection observer
          muted
          loop
          src={video?.video_url}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
        />

        <section
          className="w-[20rem] h-[7rem] absolute text-white left-0 peer-hover:bottom-16 bottom-3
        lg:right-50 lg:left-50 lg: flex flex-col justify-center items-start px-3  transition-all duration-75 ease-linear"
        >
          <h2 className="w-full font-semibold">
            <Link to={`/users/@${video?.uploaded_by?.username}`} className="hover:underline mr-1">
              {video?.uploaded_by?.username}
            </Link>
            .
            <span className="ml-1 text-zinc-400 text-sm">
              {dateFormatter(new Date(video?.uploaded_at))}
            </span>
          </h2>
          <p className="w-full text-sm text-ellipsis text-nowrap overflow-hidden hover:text-wrap hover:overflow-y-auto peer">
            {video?.title}
          </p>
          <p className="text-sm flex justify-center items-center flex-wrap">
            {video.hashtags.map((hashtag, index) => (
              <span className={`ml-1`} key={index}>
                #{hashtag}
              </span>
            ))}
          </p>
        </section>
      </div>

      <div className="w-[4rem] lg:w-[3rem] lg:h-full  flex flex-col items-center justify-center lg:static absolute right-0 bottom-24 text-white font-semibold lg:px-2">
        <button
          className="flex flex-col items-center justify-center"
          onClick={handleLikes}
          type="button"
        >
          <FaHeart
            className={`text-3xl ${
              likes?.some((like) => like.liked_by.id == user?.id)
                ? "text-red-600"
                : "text-white"
            }`}
          />
          <span className="text-center text-sm text-white">
            {pending ? "..." : likes?.length}
          </span>
        </button>
        <button
          className="flex flex-col items-center justify-center mt-5"
          onClick={() => {
            return token ? setIsModalOpen({isOpen:true}) : toast.error("Sign In Required");
          }}
        >
          <FaCommentDots className="text-3xl" />
          <span className="text-center text-sm">{comments.length}</span>
        </button>
        <div className="relative">

        <button className="flex flex-col items-center justify-center mt-5"
          onClick={() => {
            return openShareModel ? setOpenShareModel(false) : setOpenShareModel(true);
          }}>
          <FiShare2 className="text-3xl" />
          <span className="text-center text-sm">Share</span>
        </button>
        {
        openShareModel &&(<div className="absolute bottom-7 right-10">
          <Share videoId={video?.id}/>
        </div>) 
          
      }

        </div>
      </div>
     
    </div>
  );
};

export default React.memo(PlayerCard, (prevProps, nextProps) => {
  return prevProps.video.id === nextProps.video.id;
});

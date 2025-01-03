import { FaCommentDots, FaHeart } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CommentType, FollowerType, userType, VideoType } from "../types";
import {
  useGetUserProfileQuery,
  useLazyGetUserFollowersQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserFollowerMutation,
} from "../utils/store/features/user/userApi";
import { ChangeEvent, useEffect, useState } from "react";
import { dateFormatter } from "../utils/functions/formatter.ts";
import { useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import { useAddNewCommentMutation, useLazyFetchVideoByIdQuery } from "../utils/store/features/video/videoApi.ts";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";

// VideoInfo component to display video content, user information, and comments
const VideoInfo = () => {
  const [videoState, setVideoState] = useState<VideoType>(useLocation().state);
  const { data: videoUser } = useGetUserProfileQuery(
    videoState?.uploaded_by?.id
  );
  const videoId=useParams().videoId;
  const [fetchFollowers] = useLazyGetUserFollowersQuery();
  const userData = useAppSelector((state: RootState) => state.user);
  const [user,setUser]=useState<userType | null>(userData)
  const token = useAppSelector((state: RootState) => state.auth.token);
  const [commentText, setCommentText] = useState("");
  const [postComment] = useAddNewCommentMutation();
  const [followUser] = useUpdateUserFollowerMutation();
  const [followStatus, setFollowStatus] = useState<boolean>();
  const [getVideo]=useLazyFetchVideoByIdQuery();
  const [getUser]=useLazyGetUserProfileQuery();
  const {isSignedIn}=useAuth();
  const navigateTo=useNavigate();
  
  const handleCommentSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (commentText === "") {
        throw new Error("Please Write Something First");
      }

      const comment: CommentType = {
        author: {
          id: user?.id,
          username: user?.username,
          avatar_url: user?.avatar_url,
        },
        posted_at: new Date(),
        text: commentText,
      };
      const videoId = videoState?.id;

      if (!videoId) {
        throw new Error("Video Id is missing");
      }
      if (!token) {
        throw new Error("Token is missing");
      }
      toast.info("Comment is being added....");
      const query = await postComment({ comment, videoId, token }).unwrap();
      if (query) {
        setCommentText("");
        toast.success(query?.data?.message);
        setVideoState(query?.data?.newVideo);
      } else {
        throw new Error(query?.error?.data?.message);
      }
    } catch (err: any) {
      toast.error(String(err));
    } finally {
      setCommentText("");
    }
  };

  const handleFollow = async () => {
    try {
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      if (!user?.id || !videoUser?.body?.id) {
        toast.error("Follower id or Following Id is missing");
        return;
      }
      const followerId = user?.id;
      const followingId = videoUser?.body?.id;
      const query = await followUser({
        followerId,
        followingId,
        token,
      }).unwrap();
      if (query) {
        query?.result ? setFollowStatus(true) : setFollowStatus(false);
      }
    } catch (err) {
      toast.error(String(err));
    }
  };

  useEffect(()=>{
    const fetchVideoData=async()=>{
      if(!videoId){
        toast.error("Video id is missing")
        return;
      }
      const query=await getVideo(videoId).unwrap();
      if(query && query?.video){
        setVideoState(query?.video)
      }

    }

    const fetchUserData=async()=>{
      const query=await getUser(videoState?.uploaded_by?.id).unwrap();
      if(query && query?.body){
        setUser(query?.body)
      }
    }
    if(!videoState){
      fetchVideoData()
    }
    if(videoState && !user){
      fetchUserData()
    }
  })

  useEffect(() => {
    const getFollowers = async (userId: string) => {
      const query = await fetchFollowers(userId).unwrap();
      if (query && query.result) {
        setFollowStatus(
          query?.result?.some(
            (follower: FollowerType) => follower?.follower_id == user?.id
          )
        );
      }
    };
    if (videoUser && videoUser.body) {
      getFollowers(videoUser?.body?.id);
    }
  }, [videoUser]);

  return (
    // Fullscreen container with center alignment and blur backdrop
    <div className="w-screen h-screen flex justify-center  overflow-y-auto scrollbar-custom ">
      <div
        className="w-full h-full flex flex-col lg:flex-row justify-center items-center lg:p-5
       backdrop-filter backdrop-blur-lg bg-black/80 relative"
      >
        {/* Video section */}
        <div className="w-full h-full lg:h-[90%] flex items-center justify-center bg-inherit mb-3 lg:0">
          <video
            className="w-full lg:w-[25rem] h-full object-cover"
            src={videoState?.video_url} // Placeholder video source
            controls // Enables video controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
          />
        </div>

        {/* User information and comments section */}
        <div className="w-full lg:w-9/12 h-full flex flex-col justify-center items-center bg-black lg:static lg:p-3 py-3">
          {/* User information and video description */}
          <div className="w-full flex flex-col backdrop-filter backdrop-blur-lg bg-gray-500/35 lg:py-3 rounded-2xl">
            <div className="w-full flex justify-between items-center p-3">
              {/* User profile link */}
              <Link
                to={`/users/@${videoState?.uploaded_by?.username}`} // Dynamic user profile route
                className="W-1/2 flex justify-center items-center group"
              >
                <div className="rounded-full group">
                  {/* User avatar */}
                  <img
                    src={videoUser?.body?.avatar_url} // Placeholder avatar
                    alt="user"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                {/* Username with hover effect */}
                <h2 className="text-white text-lg font-semibold ml-3 group-hover:underline">
                  {videoState?.uploaded_by?.username}
                </h2>
                <p className={"text-white ml-1 text-xl"}>-</p>
                <span className={"ml-1 text-zinc-300 text-sm"}>
                  {dateFormatter(new Date(videoState?.uploaded_at))}
                </span>
              </Link>

              {/* Follow button */}
              {videoUser?.body?.id !== user?.id && (
                <button
                  className={`p-2 w-24 rounded-lg ${
                    followStatus
                      ? "bg-gray-300 text-gray-600"
                      : "bg-red-600 text-white"
                  }`}
                  onClick={isSignedIn?handleFollow:()=>{
                    toast.error("Sign In Required")
                    navigateTo("/sign-in")
                  }}
                >
                  {followStatus ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>

            {/* Video description and hashtags */}
            <div className="w-full px-3 py-2">
              <p className="text-white text-lg">{videoState?.title}</p>
              <p className="text-white text-sm">
                {videoState?.hashtags?.map((hashtag, index) => (
                  <span className={`mx-1`} key={index}>
                    #{hashtag}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Reactions section: likes and comments */}
          <div className="w-full flex flex-col items-center justify-center p-2">
            <div className="w-full flex justify-center items-center p-2 text-white">
              {/* Likes count */}
              <div className="flex justify-center items-center">
                <FaHeart className="text-2xl mx-2" />
                <span>{videoState?.Likes?.length}</span>
              </div>
              {/* Comments count */}
              <div className="flex justify-center items-center">
                <FaCommentDots className="text-2xl mx-2" />
                <span>{videoState?.comments?.length}</span>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="w-[90%] h-[40%] flex flex-col items-center justify-evenly p-1  overflow-y-auto scrollbar-custom "> 
            {videoState?.comments?.length > 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 ">
                <h2 className=" text-xl text-white text-center border-b-2 p-2">
                  All Comments
                </h2>

                <div className="w-full h-full lg:px-3 py-4 flex flex-col items-center justify-start ">
                  {/* Individual comment */}
                  {videoState?.comments?.map((comment, index) => (
                    <div
                      key={index}
                      className="w-full flex lg:flex-row justify-center items-center my-2"
                    >
                      <div>
                        {/* Commenter avatar */}
                        <img
                          src={comment?.author?.avatar_url} // Placeholder avatar
                          alt="user"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>
                      {/* Comment details */}
                      <div className="w-full flex flex-col justify-center items-start mx-3 text-sm">
                        <h2 className="text-white font-semibold">
                          <Link
                            to={`/users/@${comment?.author?.username}`}
                            className="hover:underline"
                          >
                            {comment?.author?.username}
                          </Link>
                        </h2>
                        <p className="text-white">{comment?.text}</p>
                        <span className="text-zinc-500 text-sm">
                          {dateFormatter(new Date(comment?.posted_at))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <h2 className="text-2xl text-white font-semibold">
                No Comments Yet
              </h2>
            )}
              </div>
              {
                isSignedIn?( videoState?.uploaded_by?.id !== user?.id && (
                  <form
                    className="w-full flex flex-col items-center justify-center"
                    onSubmit={handleCommentSubmit}
                  >
                    <div className="w-full flex justify-start items-center p-3">
                      <div className={`w-14 h-14 rounded-full p-2`}>
                        <img
                          src={user?.avatar_url}
                          className={`w-full h-full rounded-full object-cover`}
                        />
                      </div>
                      <textarea
                        className={`w-full h-20 rounded-xl bg-stone-700 resize-none text-zinc-300 text-lg outline-none p-3
                        focus:outline-zinc-400/40 focus:outline-[1px] placeholder:text-sm`}
                        placeholder={`Write Your Comment Here`}
                        onChange={(e) => setCommentText(e.target.value)}
                        value={commentText}
                      />
                    </div>
                    <div className={`w-full flex justify-end items-center`}>
                      <button
                        className={`py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl mr-4`}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={`py-2 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl`}
                        type="submit"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )):(
                  <button className="p-4 bg-red-500/50 text-white rounded-xl mt-3"
                  onClick={()=>navigateTo("/sign-in")}>Sign in to comment</button>
                )
              }
           
          {}
        </div>

        <button
          className="p-3 rounded-full absolute top-5 left-10 bg-gray-500 text-white"
          onClick={() => window.history.back()}
        >
          <FaX />
        </button>
      </div>
    </div>
  );
};

export default VideoInfo;

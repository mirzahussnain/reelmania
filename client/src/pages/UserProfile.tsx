import {  useGetUserFollowersQuery, useGetUsersQuery, useUpdateUserFollowerMutation, } from "../utils/store/features/user/userApi.ts";
import { useEffect, useState } from "react";
import { FollowerType, userType, VideoType } from "../types.ts";
import { useNavigate, useParams } from "react-router-dom";
import { HiOutlineUsers } from "react-icons/hi2";
import { useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import { BiSolidVideos } from "react-icons/bi";
import { useLazyFetchAllVideosQuery } from "../utils/store/features/video/videoApi.ts";
import { toast } from "react-toastify";

const UserProfile = () => {
    const navigateTo = useNavigate();
  const { data, isError, error } = useGetUsersQuery({});
  const [followerCount, setFollowerCount] = useState<number>(0);
  const username = useParams().username;
  const user=useAppSelector((state:RootState)=>state.user)
  const {token}=useAppSelector((state:RootState)=>state.auth)
  const [userProfile, setUserProfile] = useState<userType | null>(null);
  const [userVideos,setUserVideos] =useState<VideoType [] |null>(null);
  const [followStatus,setFollowStatus]=useState<boolean>();
  const {data:followersData}=useGetUserFollowersQuery(userProfile?.id ?? '',{
    skip:!userProfile
  })
  const [followUser,response]=useUpdateUserFollowerMutation();
  const [getVideos]=useLazyFetchAllVideosQuery()
  
 
 


  const handleFollow = async () => {
    try {
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      if (!user?.id || !userProfile?.id) {
        toast.error("Follower id or Following Id is missing");
        return;
      }
      const followerId = user?.id;
      const followingId = userProfile?.id
      await followUser({ followerId, followingId, token }).unwrap();
    } catch (err) {
      toast.error(String(err));
    }
  };

  
   

  useEffect(() => {
    const fetchVideos = async () => {
      if (userProfile) {
        const result = await getVideos({}).unwrap();
        const fetchedVideos = result?.videos?.filter(
          (video:VideoType) => video?.uploaded_by?.username == userProfile.username
        );
        setUserVideos(fetchedVideos);
      }
    };
    fetchVideos();
  }, [userProfile]);


  useEffect(() => {
    if (data) {
      const users: userType[] = data?.users;
      const user = users?.find(
        (user) => user?.username == username?.replace("@", "")
      );

      if (!user) {
        toast.error("Such user account is not found");
        return;
      }
      setUserProfile(user);
    } else if (isError) {
      toast.error(JSON.stringify(error));
    }
  }, [data, error, isError]);


  useEffect(()=>{
    if(followersData?.result){
        setFollowerCount(followersData?.result?.length)
        setFollowStatus(followersData?.result?.some((follower:FollowerType)=>(follower.follower_id==user?.id)));
    }
  },[followersData])


  useEffect(()=>{
    if(response?.data){
        if(response?.data?.data){
            setFollowerCount((prev)=>prev+1)
            setFollowStatus(true);
        }
        else{
            if(followerCount!=0){

                setFollowerCount((prev) => (prev - 1 ))
            }
            setFollowStatus(false)

        }}
  },[response])
  return (
    <div
      className={`h-full text-white flex flex-col items-center justify-center w-full p-3 overflow-y-auto scrollbar-custom`}
    >
      <div className="flex flex-col items-center justify-center py-3 w-full h-[100%] ">
        <div className={`w-32 h-32 rounded-full p-1`}>
          <img
            className={`w-full h-full rounded-full object-cover`}
            src={userProfile?.avatar_url}
          />
        </div>
        <h2 className={`text-sm my-2 font-medium`}>@{userProfile?.username}</h2>
        <h1
          className={`text-lg font-bold tracking-wide`}
        >{`${userProfile?.first_name} ${userProfile?.last_name}`}</h1>
        <div
          className={`w-full flex justify-center items-center text-zinc-300 text-lg my-2 `}
        >
          <HiOutlineUsers />
          <h3 className={`mx-2 text-sm`}>
            Followers:<span className={`mx-1`}>{followerCount}</span>
          </h3>
          <BiSolidVideos />
          <h3 className={`mx-2 text-sm`}>
            Videos:<span className={`mx-1`}>{userVideos?.length}</span>
          </h3>
        </div>
        {user?.id !==userProfile?.id && 
        
        userVideos?.[0]?.id !== userProfile?.id && (
              <button
                className={`p-2 w-24 rounded-lg ${
                 followStatus
                    ? "bg-gray-300 text-gray-600"
                    : "bg-red-600 text-white"
                }`}
                onClick={handleFollow}
              >
                {followStatus
                  ? "Unfollow"
                  : "Follow"}
              </button>
            )}
      </div>
      <section
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 w-full h-[100%]`}
      >
        {userVideos?.map((video, index) => (
          <div
            key={index}
            className={`w-26 h-52 rounded-xl duration-700 transition-all last:mb-20 cursor-pointer relative group overflow-hidden hover:scale-105 
                        `}
            onClick={() =>
              navigateTo(`/videos/${video?.id}`, {
                state: video,
              })
            }
          >
            <video
              src={video?.video_url}
              className={`w-full h-full object-cover rounded-xl`}
            />
            <div
              className={`absolute w-full flex flex-col justify-center items-start left-0 right-0 bottom-0 transform translate-y-full group-hover:translate-y-0
                                p-4  transition-transform duration-300 ease-in-out`}
            >
              <h2 className="text-lg tracking-wide font-semibold">
                {video?.title}
              </h2>
              <span className={`flex justify-start items-center text-sm`}>
                {video?.hashtags?.map((hashtag,index) =><p key={index} className="mr-2">

                   #{hashtag}
                    
                </p>
                    )}
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default UserProfile;

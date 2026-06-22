import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import { 
  useGetUsersQuery, 
  useGetUserFollowersQuery, 
  useUpdateUserFollowerMutation 
} from "../../utils/store/features/user/userApi";
import { useLazyFetchAllVideosQuery } from "../../utils/store/features/video/videoApi";
import { FollowerType, userType, VideoType } from "../../types";

export const useUserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAppSelector((state: RootState) => state.user);
  const { token } = useAppSelector((state: RootState) => state.auth);

  const { data, isError, error, isLoading: isUsersLoading } = useGetUsersQuery({});
  const [getVideos] = useLazyFetchAllVideosQuery();
  const [followUser, response] = useUpdateUserFollowerMutation();

  const [userProfile, setUserProfile] = useState<userType | null>(null);
  const [userVideos, setUserVideos] = useState<VideoType[] | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followStatus, setFollowStatus] = useState<boolean>(false);

  const { data: followersData, isLoading: isFollowersLoading } = useGetUserFollowersQuery(userProfile?.id ?? '', {
    skip: !userProfile
  });

  // Load User Profile
  useEffect(() => {
    if (data) {
      const users: userType[] = data?.users;
      const foundUser = users?.find(
        (u) => u?.username === username?.replace("@", "")
      );

      if (!foundUser) {
        toast.error("User account not found");
        return;
      }
      setUserProfile(foundUser);
    } else if (isError) {
      toast.error(JSON.stringify(error));
    }
  }, [data, error, isError, username]);

  // Load User Videos
  useEffect(() => {
    const fetchVideos = async () => {
      if (userProfile) {
        try {
          const result = await getVideos({}).unwrap();
          const fetchedVideos = result?.videos?.filter(
            (video: VideoType) => video?.uploaded_by?.username === userProfile.username
          );
          setUserVideos(fetchedVideos);
        } catch (err) {
          console.error("Failed to fetch videos", err);
        }
      }
    };
    fetchVideos();
  }, [userProfile, getVideos]);

  // Load Follower Data
  useEffect(() => {
    if (followersData?.result) {
      setFollowerCount(followersData.result.length);
      setFollowStatus(followersData.result.some((f: FollowerType) => f.follower_id === currentUser?.id));
    }
  }, [followersData, currentUser?.id]);

  // Handle Follow Mutation Response
  useEffect(() => {
    if (response?.data) {
      if (response.data.data) {
        setFollowerCount((prev) => prev + 1);
        setFollowStatus(true);
      } else {
        if (followerCount !== 0) {
          setFollowerCount((prev) => prev - 1);
        }
        setFollowStatus(false);
      }
    }
  }, [response, followerCount]);

  const handleFollow = async () => {
    try {
      if (!token) {
        window.location.href = "/sign-up";
        return;
      }
      if (!currentUser?.id || !userProfile?.id) {
        toast.error("Follower id or Following Id is missing");
        return;
      }
      await followUser({ followerId: currentUser.id, followingId: userProfile.id, token }).unwrap();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const isLoading = isUsersLoading || (userProfile && isFollowersLoading);

  return {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading
  };
};

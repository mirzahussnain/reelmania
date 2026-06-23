import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useCurrentUser } from "./useCurrentUser";
import {
  useGetUserByUsernameQuery,
  useCheckUserFollowerQuery,
  useUpdateUserFollowerMutation,
} from "../../utils/store/features/user/userApi";
import { useFetchUserVideosQuery } from "../../utils/store/features/video/videoApi";
import { userType, VideoType } from "../../types";

export const useUserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, token } = useCurrentUser();

  const cleanUsername = username?.replace("@", "");

  // O(1) profile lookup by username (replaces downloading all users + find).
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError,
  } = useGetUserByUsernameQuery(cleanUsername as string, { skip: !cleanUsername });
  const userProfile: userType | null = profileData?.data ?? null;

  // Per-user videos endpoint (replaces fetching ALL videos and filtering).
  const { data: videosData, isLoading: isVideosLoading } = useFetchUserVideosQuery(
    userProfile?.id,
    { skip: !userProfile?.id }
  );
  const userVideos: VideoType[] = videosData?.data ?? [];

  // O(1) follow-status check (replaces pulling the full follower list).
  const { data: followCheck } = useCheckUserFollowerQuery(
    { followingId: userProfile?.id ?? "", followerId: currentUser?.id ?? "" },
    { skip: !userProfile?.id || !currentUser?.id, refetchOnMountOrArgChange: true }
  );

  const [followUser] = useUpdateUserFollowerMutation();
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followStatus, setFollowStatus] = useState<boolean>(false);

  // Seed follower count from the profile's denormalized _count.
  useEffect(() => {
    const count = userProfile?._count?.followers_followers_following_idTousers;
    if (typeof count === "number") setFollowerCount(count);
  }, [userProfile]);

  // Seed follow status from the O(1) check.
  useEffect(() => {
    if (followCheck) setFollowStatus(!!followCheck.data?.isFollowing);
  }, [followCheck]);

  useEffect(() => {
    if (isError) toast.error("User account not found");
  }, [isError]);

  const handleFollow = async () => {
    if (!token) {
      window.location.href = "/sign-up";
      return;
    }
    if (!currentUser?.id || !userProfile?.id) {
      toast.error("Follower id or Following Id is missing");
      return;
    }

    // Optimistic toggle; revert if the mutation fails.
    const next = !followStatus;
    setFollowStatus(next);
    setFollowerCount((c) => (next ? c + 1 : Math.max(0, c - 1)));

    try {
      await followUser({
        followerId: currentUser.id,
        followingId: userProfile.id,
        token,
      }).unwrap();
    } catch (err) {
      setFollowStatus(!next);
      setFollowerCount((c) => (next ? Math.max(0, c - 1) : c + 1));
      toast.error(String(err));
    }
  };

  const isLoading = isProfileLoading || (!!userProfile && isVideosLoading);

  return {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading,
  };
};

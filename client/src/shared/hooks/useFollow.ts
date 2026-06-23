import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import {
  useCheckUserFollowerQuery,
  useUpdateUserFollowerMutation,
} from "../../utils/store/features/user/userApi";

/**
 * Follow status + toggle for a target user. Status is resolved with the O(1)
 * check-follower endpoint; the toggle is optimistic and reverts on failure.
 */
export const useFollow = (targetUserId: string | undefined) => {
  const { token } = useAppSelector((state: RootState) => state.auth);
  const currentUser = useAppSelector((state: RootState) => state.user);
  const [followUser] = useUpdateUserFollowerMutation();

  const { data: followCheck } = useCheckUserFollowerQuery(
    { followingId: targetUserId ?? "", followerId: currentUser?.id ?? "" },
    { skip: !targetUserId || !currentUser?.id }
  );

  const [followStatus, setFollowStatus] = useState(false);

  useEffect(() => {
    if (followCheck) setFollowStatus(!!followCheck.isFollowing);
  }, [followCheck]);

  const handleFollow = async () => {
    if (!token) {
      toast.error("User is not authenticated.");
      return;
    }
    if (!currentUser?.id || !targetUserId) {
      toast.error("User ID is missing.");
      return;
    }

    const next = !followStatus;
    setFollowStatus(next); // optimistic
    try {
      await followUser({
        followerId: currentUser.id,
        followingId: targetUserId,
        token,
      }).unwrap();
    } catch (err) {
      setFollowStatus(!next); // revert
      toast.error(String(err));
    }
  };

  return { followStatus, handleFollow };
};

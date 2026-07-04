import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetUserFollowersQuery, useGetUserFollowingQuery, useGetMyProfileQuery } from "../utils/store/features/user/userApi";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { FiArrowLeft } from "react-icons/fi";
import Loader from "../components/Loader";
import { Button } from "../shared/components/ui/Button";
import { NetworkView } from "../shared/components/network/NetworkView";
import { NETWORK } from "../shared/constants/network";

/** Owner's in-app network view. Thin wrapper around the shared NetworkView. */
const NetworkRelations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Deep-link from the Vault "Following" stat: ?tab=following opens that tab.
  const initialTab = searchParams.get("tab") === "following" ? NETWORK.FOLLOWING : undefined;
  const user = useAppSelector((state: RootState) => state.user);
  const { token } = useAppSelector((state: RootState) => state.auth);

  const { data: profileData } = useGetMyProfileQuery(
    { id: user?.id, token },
    { skip: !user?.id || !token }
  );
  const userProfile = profileData?.data;

  const { data: followersData, isLoading } = useGetUserFollowersQuery(userProfile?.id || "", {
    skip: !userProfile?.id,
  });
  // Owner-only "Following" list — the users this person follows.
  const { data: followingData } = useGetUserFollowingQuery(userProfile?.id || "", {
    skip: !userProfile?.id,
  });

  if (isLoading || !userProfile) return <Loader />;

  return (
    <div className="page-shell px-4 md:px-12 py-8">
      <Button
        variant="unstyled"
        onClick={() => navigate("/vault")}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-8 transition-colors w-max"
      >
        <FiArrowLeft />
        <span className="text-sm font-semibold tracking-widest uppercase">Return to Vault</span>
      </Button>

      <NetworkView
        userProfile={userProfile}
        followers={followersData?.data || []}
        following={followingData?.data || []}
        totalNodes={followersData?.meta?.total || 0}
        isOwner
        initialTab={initialTab}
      />
    </div>
  );
};

export default NetworkRelations;

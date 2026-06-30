import React, { useState } from "react";
import Loader from "../components/Loader";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { UserProfileHeader } from "../shared/components/profile/UserProfileHeader";
import { UserVideoGrid, VideoCard } from "../shared/components/profile/UserVideoGrid";
import { Carousel } from "../shared/components/ui/Carousel";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import { Link } from "react-router-dom";
import { BRAND } from "../shared/constants/brand";
import { useGetPublicCollectionsQuery } from "../utils/store/features/collections/curationApi";
import { CollectionCard } from "../shared/components/collections/CollectionCard";
import { CollectionModal } from "../shared/components/collections/CollectionModal";
import type { CollectionListItem } from "../shared/contracts/api";

const PublicProfile: React.FC = () => {
  const {
    currentUser,
    userProfile,
    userVideos,
    followerCount,
    followStatus,
    handleFollow,
    isLoading
  } = useUserProfile();

  const isMobile = useScreenWidth() <= 640;
  const [openScope, setOpenScope] = useState<CollectionListItem | null>(null);
  // The profile owner's PUBLIC Scopes (server returns public-only to non-owners).
  const { data: scopesData } = useGetPublicCollectionsQuery(
    { ownerId: userProfile?.id as string },
    { skip: !userProfile?.id }
  );
  const scopes = scopesData?.data ?? [];
  const hasCreations = (userVideos?.length ?? 0) > 0;
  const hasCurations = scopes.length > 0;

  if (isLoading) return <Loader />;

  if (!userProfile) {
    return (
      <div className="w-full h-screen bg-background flex justify-center items-center text-on-surface-variant font-jetbrains">
        User not found.
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userProfile.id;

  return (
    <div className="w-full min-h-screen bg-transparent relative flex flex-col items-center pt-10 pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
      </div>

      {/* Brand / Logo area */}
      <header className="w-full flex justify-center mb-10">
        <span className="text-4xl md:text-5xl font-syne font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-glow-primary">
          {BRAND}
        </span>
      </header>

      {/* Main Content Container */}
      <div className="w-full flex flex-col items-center justify-start mt-4">
        <UserProfileHeader
          userProfile={userProfile}
          followerCount={followerCount}
          videoCount={userVideos?.length || 0}
          isCurrentUser={isCurrentUser}
          followStatus={followStatus}
          handleFollow={handleFollow}
          className="pt-2"
        />

        {/* Featured — Creations (their Kines) + Curations (their Scopes).
            The whole section hides when both are empty; each sub-section hides
            when its own content is empty. */}
        {(hasCreations || hasCurations) && (
          <section className="w-full mt-12 z-10">
            <div className="w-full max-w-6xl mx-auto px-4">
              <h3 className="font-syne font-bold text-2xl md:text-3xl text-on-surface mb-8">
                Featured
              </h3>
            </div>

            {hasCreations && (
              <div className="mb-12">
                <div className="w-full max-w-6xl mx-auto px-4">
                  <h4 className="font-syne font-semibold text-base md:text-lg text-on-surface-variant mb-4">
                    Popular Creations
                  </h4>
                </div>
                {/* Mobile: carousel when more than one card; otherwise the grid. */}
                {isMobile && userVideos.length > 1 ? (
                  <Carousel>
                    {userVideos.slice(0, 3).map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </Carousel>
                ) : (
                  <UserVideoGrid userVideos={userVideos.slice(0, 3)} heading={null} className="mt-0 pb-0" />
                )}
              </div>
            )}

            {/* Same container + grid as UserVideoGrid so Scope cards match
                Kine cards in size and alignment. */}
            {hasCurations && (
              <div className="w-full max-w-6xl mx-auto px-4">
                <h4 className="font-syne font-semibold text-base md:text-lg text-on-surface-variant mb-4">
                  Popular Curations
                </h4>
                {isMobile && scopes.length > 1 ? (
                  <Carousel>
                    {scopes.map((c) => (
                      <CollectionCard key={c.id} collection={c} onOpen={setOpenScope} />
                    ))}
                  </Carousel>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scopes.map((c) => (
                      <CollectionCard key={c.id} collection={c} onOpen={setOpenScope} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Closing CTA. The Connect/Disconnect action lives in the profile header;
          this card is a closing prompt only.
          • Signed out → generic "Experience {BRAND}" + sign-up.
          • Signed in (other profile) → light "keep exploring" + Discover link.
          (Hidden on the viewer's own profile.) */}
      {!isCurrentUser && (
        <div className="w-[90%] max-w-4xl rounded-3xl border border-hairline/5 bg-gradient-to-b from-hairline/[0.04] to-transparent p-12 mt-12 mb-20 flex flex-col items-center z-10 relative overflow-hidden backdrop-blur-md">

          <h3 className="text-3xl md:text-4xl font-syne font-bold text-on-surface text-center">
            {!currentUser ? <>Experience {BRAND}</> : "Discover More"}
          </h3>

          <div className="w-full flex justify-center mt-4">
            <p className="text-on-surface-variant text-base md:text-lg w-[90%] max-w-[600px] text-center leading-relaxed">
              {!currentUser
                ? "Join the network to curate your own archives, build collections, and discover standout shorts from the creators you follow."
                : `Keep exploring ${BRAND} — find new creators, curated Scopes, and fresh shorts to add to your network.`}
            </p>
          </div>

          <Link
            to={!currentUser ? "/sign-up" : "/discover"}
            className="mt-8 border border-secondary/50 bg-transparent hover:bg-secondary/10 text-secondary text-sm md:text-base font-bold px-10 py-3 rounded-full transition-all duration-300"
          >
            {!currentUser ? "Join the Network" : "Explore Discover"}
          </Link>
        </div>
      )}

      {/* Read-only Scope viewer (non-owners can't manage) */}
      <CollectionModal
        collection={openScope}
        isOpen={!!openScope}
        onClose={() => setOpenScope(null)}
        canManage={isCurrentUser}
      />
    </div>
  );
};

export default PublicProfile;

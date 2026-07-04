import React, { useState } from "react";
import { Carousel } from "../ui/Carousel";
import useScreenWidth from "../../../utils/hooks/useScreenWidth";
import { UserVideoGrid, VideoCard } from "./UserVideoGrid";
import { CollectionCard } from "../collections/CollectionCard";
import { CollectionModal } from "../collections/CollectionModal";
import { useGetPublicCollectionsQuery } from "../../../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../../contracts/api";
import type { userType, VideoType } from "../../../types";

interface ProfileFeaturedProps {
  userProfile: userType;
  userVideos: VideoType[];
  /** Owner viewing their own profile — enables managing Scopes in the modal. */
  isCurrentUser: boolean;
}

const H4 =
  "font-syne font-semibold text-base md:text-lg text-on-surface-variant mb-4 border-b border-hairline/10 pb-2";

/**
 * A profile's "Featured" section — top Creations (Kines) + Curations (Scopes).
 * Shared by the in-app profile (`/users/:username`) and the public shareable
 * profile (`/share/profile/:username`) so they never drift. Fetches the owner's
 * public Scopes itself; hides entirely when there's nothing to show.
 */
export const ProfileFeatured: React.FC<ProfileFeaturedProps> = ({ userProfile, userVideos, isCurrentUser }) => {
  const isMobile = useScreenWidth() <= 640;
  const [openScope, setOpenScope] = useState<CollectionListItem | null>(null);

  const { data: scopesData } = useGetPublicCollectionsQuery(
    { ownerId: userProfile.id },
    { skip: !userProfile.id }
  );
  const scopes = scopesData?.data ?? [];
  const hasCreations = (userVideos?.length ?? 0) > 0;
  const hasCurations = scopes.length > 0;

  if (!hasCreations && !hasCurations) return null;

  return (
    <>
      <section className="w-full mt-12 z-10">
        <div className="w-full max-w-6xl mx-auto px-4">
          <h3 className="font-syne font-bold text-2xl md:text-3xl text-on-surface mb-8">Featured</h3>
        </div>

        {hasCreations && (
          <div className="mb-12">
            <div className="w-full max-w-6xl mx-auto px-4">
              <h4 className={H4}>Popular Creations</h4>
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

        {hasCurations && (
          <div className="w-full max-w-6xl mx-auto px-4">
            <h4 className={H4}>Popular Curations</h4>
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

      {/* Read-only Scope viewer (non-owners can't manage) */}
      <CollectionModal
        collection={openScope}
        isOpen={!!openScope}
        onClose={() => setOpenScope(null)}
        canManage={isCurrentUser}
      />
    </>
  );
};

export default ProfileFeatured;

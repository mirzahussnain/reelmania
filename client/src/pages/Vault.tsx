import React, { useState } from "react";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { useGetMyProfileQuery } from "../utils/store/features/user/userApi";
import { useFetchUserVideosQuery } from "../utils/store/features/video/videoApi";
import { VideoType } from "../types";
import { useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { FaBell } from "react-icons/fa";
import { SearchField } from "../shared/components/ui/SearchField";
import Loader from "../components/Loader";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import { Avatar } from "../shared/components/ui/Avatar";
import { StatBlock } from "../shared/components/ui/StatBlock";
import { BadgeRow } from "../shared/components/ui/Badge";
import { Button } from "../shared/components/ui/Button";
import { EmptyState } from "../shared/components/ui/EmptyState";
import { VideoThumbnailCard } from "../shared/components/ui/VideoThumbnailCard";
import { CollectionModal } from "../shared/components/collections/CollectionModal";
import { EditCollectionModal } from "../shared/components/collections/EditCollectionModal";
import { CollectionCard } from "../shared/components/collections/CollectionCard";
import { useGetMyCollectionsQuery } from "../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../shared/contracts/api";
import { COLLECTION_UNIT, COLLECTION_NOUN_PLURAL } from "../shared/constants/curation";
import { NETWORK } from "../shared/constants/network";

const Vault: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state: RootState) => state.user);
  const { token } = useAppSelector((state: RootState) => state.auth);

  const queryParam = { id: user?.id, token };
  const { data: profileData, isLoading: profileLoading } = useGetMyProfileQuery(queryParam, {
    skip: !user?.id || !token,
  });

  const userProfile = profileData?.data;

  // Per-user videos endpoint (replaces fetching ALL videos and filtering).
  const { data: videosData, isLoading: isLoadingVideos } = useFetchUserVideosQuery(
    userProfile?.id,
    { skip: !userProfile?.id }
  );
  const userVideos: VideoType[] = videosData?.data ?? [];
  const [activeTab, setActiveTab] = useState("My Uploads");
  const [vaultSearch, setVaultSearch] = useState("");
  const [openCollection, setOpenCollection] = useState<CollectionListItem | null>(null);
  const [editingCollection, setEditingCollection] = useState<CollectionListItem | null>(null);

  // Scoped search: filters only the active tab's items (the user's own
  // library), not a global search. Liked/Collections are placeholders until
  // those endpoints exist.
  const activeVideos: VideoType[] = activeTab === "My Uploads" ? userVideos : [];
  const q = vaultSearch.trim().toLowerCase();
  const visibleVideos = q
    ? activeVideos.filter((v) => v.title?.toLowerCase().includes(q))
    : activeVideos;

  // Curated collections from curation-service (own collections, with previews).
  const { data: collectionsData } = useGetMyCollectionsQuery(
    { token },
    { skip: !token }
  );
  const collections = collectionsData?.data ?? [];
  const visibleCollections = q
    ? collections.filter((c) => c.title.toLowerCase().includes(q))
    : collections;

  if (profileLoading) return <Loader />;

  return (
    <div className="w-full h-full flex flex-col bg-surface text-on-surface overflow-y-auto overflow-x-hidden scrollbar-hide">

      {/* 1. Cinematic Banner Section */}
      <div className="relative w-full h-[35vh] lg:h-[45vh] shrink-0">
        <img
          src="/images/vault-banner.png"
          alt="Vault Banner"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay fading into bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />

        {/* Top Header (Absolute over banner) */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start sm:items-center z-10">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <Button
              variant="unstyled"
              onClick={() => navigate(-1)}
              className="w-10 h-10 shrink-0 rounded-full bg-media-scrim backdrop-blur-md flex items-center justify-center hover:bg-media-scrim-lg transition"
            >
              <BiArrowBack className="text-xl text-on-media" />
            </Button>
            <span className="hidden sm:block font-jetbrains text-xs md:text-sm text-primary tracking-widest font-semibold drop-shadow-md">
              USER_VAULT / ARCHIVE_001
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end pl-2">
            <CopyToClipboard
              text={`${window.location.origin}/share/profile/${userProfile?.username}`}
              onCopy={() => toast.success("Public Profile link copied to clipboard!")}
            >
              <Button variant="unstyled" className="px-4 md:px-5 py-2 rounded-full bg-media-scrim backdrop-blur-md text-xs md:text-sm font-semibold hover:bg-media-scrim-lg transition border border-outline-variant/30 text-on-media whitespace-nowrap">
                Share Profile
              </Button>
            </CopyToClipboard>

            <CopyToClipboard
              text={`${window.location.origin}/share/network/${userProfile?.username}`}
              onCopy={() => toast.success("Network Relations link copied to clipboard!")}
            >
              <Button variant="unstyled" className="px-4 md:px-5 py-2 rounded-full bg-media-scrim backdrop-blur-md text-xs md:text-sm font-semibold hover:bg-media-scrim-lg transition border border-outline-variant/30 text-on-media whitespace-nowrap">
                Share Network
              </Button>
            </CopyToClipboard>

            <Button variant="unstyled" className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full bg-media-scrim backdrop-blur-md flex items-center justify-center hover:bg-media-scrim-lg transition border border-outline-variant/30">
              <FaBell className="text-on-media text-sm md:text-base" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Floating Profile Card */}
      <div className="px-6 lg:px-12 -mt-24 lg:-mt-32 relative z-20 flex flex-col pb-20">

        {/* Profile Card */}
        <div className="card-elevated p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-8">

          {/* Avatar */}
          <Avatar
            src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
            username={userProfile?.username}
            size="xl"
            shape="2xl"
            ring
            verified={!!userProfile?.is_verified}
          />

          {/* User Info */}
          <div className="flex-1 flex flex-col text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-syne font-bold tracking-wide text-on-surface">
              {userProfile?.first_name} {userProfile?.last_name}
            </h1>
            <h2 className="text-primary font-medium mt-1 mb-4">@{userProfile?.username}</h2>

            <p className="text-on-surface-variant text-sm lg:text-base max-w-2xl leading-relaxed mb-4">
              {userProfile?.bio?.trim() || "Curating on Kinetix."}
            </p>

            {/* Earned badges — server-derived */}
            <BadgeRow badges={userProfile?.badges} size={60} className="justify-center lg:justify-start mb-6" />

            {/* Stats Block — wraps on mobile (dividers hidden so wrapped rows
                don't start with a stray divider); inline with dividers on sm+. */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-4 sm:gap-8 lg:gap-12">
              <StatBlock
                value={userProfile?._count?.followers_followers_following_idTousers || 0}
                label={NETWORK.FOLLOWERS}
                onClick={() => navigate('/vault/network')}
              />
              <div className="divider-v hidden sm:block"></div>
              <StatBlock
                value={userProfile?._count?.followers_followers_follower_idTousers || 0}
                label={NETWORK.FOLLOWING}
                onClick={() => navigate('/vault/network?tab=following')}
              />
              <div className="divider-v hidden sm:block"></div>
              <StatBlock value={collections?.length || 0} label={COLLECTION_NOUN_PLURAL} />
              <div className="divider-v hidden sm:block"></div>
              {/* C-Score reads the persisted percentile; 0 until the scoring job runs. */}
              <StatBlock value={userProfile?.c_score ?? 0} label="C-Score" highlight />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate(`/share/profile/${userProfile?.username}`)}
              className="px-8 py-3 rounded-xl font-bold"
            >
              View Public Profile
            </Button>
            <Button className="px-8 py-3 rounded-xl font-bold glow-primary hover:scale-105">
              Edit Vault
            </Button>
          </div>
        </div>

        {/* 3. Tab Navigation + scoped search */}
        <div className="w-full mt-10 border-b border-hairline/10 flex items-center justify-between gap-4 px-2 flex-wrap">
          <div className="flex items-center gap-8">
            {['My Uploads', 'Liked', COLLECTION_NOUN_PLURAL].map((tab) => (
              <Button
                key={tab}
                variant="unstyled"
                onClick={() => setActiveTab(tab)}
                className={`pb-4 relative font-jetbrains text-sm font-semibold tracking-wide transition-colors ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="neon-bar absolute -bottom-px left-0 w-full" />
                )}
              </Button>
            ))}
          </div>
          <SearchField
            value={vaultSearch}
            onChange={setVaultSearch}
            placeholder={`Search in ${activeTab}…`}
            className="mb-2 w-full sm:w-64"
          />
        </div>

        {/* 4. Content Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {activeTab === COLLECTION_NOUN_PLURAL ? (
            visibleCollections.length > 0 ? (
              visibleCollections.map((c) => (
                <CollectionCard
                  key={c.id}
                  collection={c}
                  onOpen={setOpenCollection}
                  onManage={setEditingCollection}
                />
              ))
            ) : (
              <EmptyState className="col-span-full" message={q ? `No ${COLLECTION_NOUN_PLURAL} match “${vaultSearch}”.` : `No ${COLLECTION_NOUN_PLURAL} yet — curate ${COLLECTION_UNIT}s to build one.`} />
            )
          ) : isLoadingVideos ? (
            <div className="col-span-full py-10 flex justify-center">
              <Loader />
            </div>
          ) : visibleVideos.length > 0 ? (
            visibleVideos.map((video, idx) => (
              <VideoThumbnailCard
                key={video.id || idx}
                video={video}
                variant="vault"
                index={idx}
                onClick={() => navigate(`/videos/${video.id}`, { state: video })}
              />
            ))
          ) : (
            <EmptyState className="col-span-full" message={q ? `No results in ${activeTab} for “${vaultSearch}”.` : "No vaults archived yet."} />
          )}
        </div>
      </div>

      <CollectionModal
        collection={openCollection}
        isOpen={!!openCollection}
        onClose={() => setOpenCollection(null)}
        canManage
      />

      <EditCollectionModal
        collection={editingCollection}
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        onDeleted={(id) => {
          // If the deleted collection's detail modal is open, close it too.
          if (openCollection?.id === id) setOpenCollection(null);
        }}
      />
    </div>
  );
};

export default Vault;

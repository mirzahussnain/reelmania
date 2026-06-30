import React from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiTrash2 } from "react-icons/fi";
import { MdLoop } from "react-icons/md";
import { toast } from "react-toastify";
import { collectionCountLabel, COLLECTION_NOUN, COLLECTION_UNIT } from "../../constants/curation";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useGetCollectionBySlugQuery,
  useRemoveItemMutation,
} from "../../../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../../contracts/api";
import Loader from "../../../components/Loader";

interface CollectionModalProps {
  collection: CollectionListItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Owner-only: show the per-Kine remove control. Off on public profiles. */
  canManage?: boolean;
}

/**
 * Slide-up modal showing a collection's title + its items. The grid card only
 * has previews/counts, so we fetch the full hydrated item list (videos resolved
 * by curation-service) by owner+slug when opened.
 */
export const CollectionModal: React.FC<CollectionModalProps> = ({ collection, isOpen, onClose, canManage = false }) => {
  const navigate = useNavigate();
  const { token } = useCurrentUser();
  const [removeItem] = useRemoveItemMutation();

  const handleRemove = async (videoId: string) => {
    if (!collection) return;
    try {
      await removeItem({ collectionId: collection.id, videoId, token }).unwrap();
      toast.success(`Removed from ${COLLECTION_NOUN}`);
    } catch {
      toast.error("Could not remove video");
    }
  };

  const { data, isLoading } = useGetCollectionBySlugQuery(
    { ownerId: collection?.ownerId as string, slug: collection?.slug as string, token },
    { skip: !collection || !isOpen }
  );
  const items = data?.data?.items ?? [];
  const total = data?.data?.items?.length ?? collection?._count?.items ?? 0;

  if (!collection) return null;

  return (
    <Sheet isOpen={isOpen} onClose={onClose} variant="bottom" className="h-[85dvh] bg-surface-container-low border-t border-outline-variant/20 rounded-t-3xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 pt-4 pb-4 border-b border-outline-variant/10">
        <div className="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto mb-4" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-syne font-bold text-2xl md:text-3xl text-on-surface">{collection.title}</h2>
            <p className="flex items-center gap-1.5 text-sm font-jetbrains text-on-surface-variant mt-1">
              <MdLoop /> {collectionCountLabel(total)}
            </p>
          </div>
          <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <FiX className="text-lg" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Loader /></div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant">
            <p className="font-semibold">This {COLLECTION_NOUN} is empty.</p>
            <p className="text-sm">Curate {COLLECTION_UNIT}s with the bookmark button to fill it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group aspect-9/16">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/videos/${item.videoId}`);
                  }}
                  className="card-solid w-full h-full relative rounded-md overflow-hidden text-left"
                >
                  {item.video?.video_url ? (
                    <video src={item.video.video_url} muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    // Video deleted/unavailable — keep the slot, don't break the grid.
                    <div className="w-full h-full bg-surface-container-high" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-scrim/90 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-on-media font-bold text-xs line-clamp-1">{item.video?.title ?? "Unavailable"}</p>
                    {item.video?.uploaded_by?.username && <p className="text-on-media-dim text-[10px] font-jetbrains">@{item.video.uploaded_by.username}</p>}
                  </div>
                </button>
                {/* Owner-only: remove this Kine from the Scope. Visible on
                    mobile (no hover), hover-revealed on desktop (md+). */}
                {canManage && (
                  <Button
                    variant="unstyled"
                    aria-label={`Remove from ${COLLECTION_NOUN}`}
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.videoId); }}
                    className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-media-scrim backdrop-blur-md text-on-media text-sm hover:bg-error hover:text-on-error transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                  >
                    <FiTrash2 />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
};

export default CollectionModal;

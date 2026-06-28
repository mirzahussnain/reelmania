import React from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGetCollectionBySlugQuery } from "../../../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../../contracts/api";
import Loader from "../../../components/Loader";

interface CollectionModalProps {
  collection: CollectionListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-up modal showing a collection's title + its items. The grid card only
 * has previews/counts, so we fetch the full hydrated item list (videos resolved
 * by curation-service) by owner+slug when opened.
 */
export const CollectionModal: React.FC<CollectionModalProps> = ({ collection, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { token } = useCurrentUser();

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
            <p className="text-sm font-jetbrains text-on-surface-variant mt-1">{total} items</p>
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
            <p className="font-semibold">This collection is empty.</p>
            <p className="text-sm">Curate videos with the bookmark button to fill it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onClose();
                  navigate(`/videos/${item.videoId}`);
                }}
                className="card-solid relative aspect-9/16 rounded-md overflow-hidden group text-left"
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
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
};

export default CollectionModal;

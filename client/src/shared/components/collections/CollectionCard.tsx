import React from "react";
import { MdLoop } from "react-icons/md";
import { FiMoreVertical } from "react-icons/fi";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { collectionCountLabel } from "../../constants/curation";
import type { CollectionListItem } from "../../contracts/api";

interface CollectionCardProps {
  collection: CollectionListItem;
  onOpen: (c: CollectionListItem) => void;
  /** Owner-only: when provided, shows the manage (kebab) affordance. */
  onManage?: (c: CollectionListItem) => void;
}

/**
 * A Scope (collection) card: cover image if set, else a mosaic of its first
 * Kines, else a gradient. Title + Kine count sit under the title. Shared by the
 * Vault (with manage) and the public profile (read-only).
 */
export const CollectionCard: React.FC<CollectionCardProps> = ({ collection: c, onOpen, onManage }) => (
  <div className="relative group aspect-9/16">
    <button
      onClick={() => onOpen(c)}
      className="card-solid w-full h-full relative rounded-md overflow-hidden cursor-pointer flex flex-col justify-end border border-outline-variant/15 text-left"
    >
      {/* Cover image if set, else a video mosaic */}
      {c.coverImageUrl ? (
        <img src={c.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : c.previews.length > 0 ? (
        <div
          className={cn(
            "absolute inset-0 grid gap-0.5",
            c.previews.length === 1 ? "grid-cols-1 grid-rows-1"
              : c.previews.length === 2 ? "grid-cols-2 grid-rows-1"
              : "grid-cols-2 grid-rows-2"
          )}
        >
          {c.previews.slice(0, 4).map((it) => (
            <video key={it.id} src={it.video_url} muted playsInline className="w-full h-full object-cover" />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-surface-container to-surface-container-low" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-scrim/90 via-scrim/20 to-transparent" />
      <div className="relative z-10 p-3">
        <h3 className="font-syne font-bold text-on-media text-sm line-clamp-2 drop-shadow-lg">{c.title}</h3>
        <p className="flex items-center gap-1 mt-0.5 text-[10px] font-jetbrains font-semibold text-on-media-dim">
          <MdLoop className="text-[12px]" />
          {collectionCountLabel(c._count?.items ?? 0)}
        </p>
      </div>
    </button>

    {onManage && (
      <Button
        variant="unstyled"
        aria-label="Manage Scope"
        onClick={(e) => { e.stopPropagation(); onManage(c); }}
        className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-media-scrim backdrop-blur-md text-on-media opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-media-scrim-lg"
      >
        <FiMoreVertical className="text-sm" />
      </Button>
    )}
  </div>
);

export default CollectionCard;

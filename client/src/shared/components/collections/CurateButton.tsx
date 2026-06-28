import React, { useState } from "react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { useAppSelector } from "../../../utils/hooks/storeHooks";
import { RootState } from "../../../utils/store/store";
import { VideoType } from "../../../types";
import { cn } from "../../utils/cn";
import { AddToCollectionModal } from "./AddToCollectionModal";

interface CurateButtonProps {
  video: VideoType;
  /** Extra classes for the trigger button (each context styles its own chrome). */
  className?: string;
  /** Optional text label rendered next to the icon (e.g. on the video page). */
  label?: string;
}

/**
 * "Add to collection" (curate) trigger. Shows a filled bookmark when the video
 * is already in at least one of the user's collections. Curation applies to any
 * video — independent of whether it has a sellable asset (the cart button).
 */
export const CurateButton: React.FC<CurateButtonProps> = ({ video, className, label }) => {
  const [open, setOpen] = useState(false);
  const saved = useAppSelector((s: RootState) =>
    s.collections.items.some((c) => c.items.some((i) => i.id === video?.id))
  );

  return (
    <>
      <button
        aria-label="Add to collection"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn("flex items-center justify-center transition-colors", className)}
      >
        {saved ? <BsBookmarkFill className="text-primary" /> : <BsBookmark />}
        {label && <span>{saved ? "Saved" : label}</span>}
      </button>
      <AddToCollectionModal video={video} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default CurateButton;

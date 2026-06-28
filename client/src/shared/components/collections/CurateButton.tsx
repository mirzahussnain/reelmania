import React from "react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { VideoType } from "../../../types";
import { cn } from "../../utils/cn";
import { useCuration, useIsCurated } from "../../hooks/useCuration";

interface CurateButtonProps {
  video: VideoType;
  /** Extra classes for the trigger button (each context styles its own chrome). */
  className?: string;
  /** Optional text label rendered next to the icon (e.g. on the video page). */
  label?: string;
}

/**
 * "Add to collection" (curate) trigger. Filled bookmark when the video is in a
 * collection. Opens the single app-level modal via useCuration (auth-gated).
 * Curation applies to any video — independent of the sellable-asset cart.
 */
export const CurateButton: React.FC<CurateButtonProps> = ({ video, className, label }) => {
  const { openCurate } = useCuration();
  const saved = useIsCurated(video?.id);

  return (
    <button
      aria-label="Add to collection"
      onClick={(e) => {
        e.stopPropagation();
        openCurate(video);
      }}
      className={cn("flex items-center justify-center transition-colors", className)}
    >
      {saved ? <BsBookmarkFill className="text-primary" /> : <BsBookmark />}
      {label && <span>{saved ? "Saved" : label}</span>}
    </button>
  );
};

export default CurateButton;

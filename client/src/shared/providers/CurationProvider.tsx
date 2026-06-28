import React, { createContext, useContext, useState } from "react";
import { VideoType } from "../../types";
import { AddToCollectionModal } from "../components/collections/AddToCollectionModal";
import { useGetCuratedIdsQuery } from "../../utils/store/features/collections/curationApi";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface CurationContextValue {
  /** Open the single app-level "add to collection" modal for a video. */
  open: (video: VideoType) => void;
}

const CurationContext = createContext<CurationContextValue | null>(null);

/**
 * Owns the ONE add-to-collection modal for the whole app. Curate buttons just
 * call `open(video)` — no per-button modal instances (one store subscriber
 * instead of N). Keeps the last target during the close animation.
 */
export const CurationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<VideoType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { token, isSignedIn } = useCurrentUser();

  // One app-level subscription to the caller's curated ids. Keeps the
  // collections slice (selectSavedVideoIds → useIsCurated) populated and fresh
  // so feed cards don't each fetch; mutations invalidate CuratedIds → refetch.
  useGetCuratedIdsQuery({ token }, { skip: !isSignedIn || !token });

  const open = (video: VideoType) => {
    setTarget(video);
    setIsOpen(true);
  };

  return (
    <CurationContext.Provider value={{ open }}>
      {children}
      {target && (
        <AddToCollectionModal video={target} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </CurationContext.Provider>
  );
};

export const useCurationContext = (): CurationContextValue => {
  const ctx = useContext(CurationContext);
  if (!ctx) throw new Error("useCurationContext must be used within a CurationProvider");
  return ctx;
};

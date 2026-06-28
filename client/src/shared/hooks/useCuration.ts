import { useCallback } from "react";
import { toast } from "react-toastify";
import { VideoType } from "../../types";
import { useCurrentUser } from "./useCurrentUser";
import { useCurationContext } from "../providers/CurationProvider";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { selectSavedVideoIds } from "../../utils/store/features/collections/collectionsSlice";
import { AUTH_REQUIRED } from "../constants/messages";

/**
 * Curation domain logic in one place: auth-gated open of the shared modal.
 * Keeps the gate + messaging out of the presentational CurateButton.
 */
export const useCuration = () => {
  const { isSignedIn } = useCurrentUser();
  const { open } = useCurationContext();

  const openCurate = useCallback(
    (video: VideoType) => {
      if (!isSignedIn) {
        toast.info(AUTH_REQUIRED.curate);
        return;
      }
      open(video);
    },
    [isSignedIn, open]
  );

  return { openCurate };
};

/** O(1) check whether a video is in any of the user's collections. */
export const useIsCurated = (videoId: string | undefined): boolean =>
  useAppSelector((state) => (videoId ? selectSavedVideoIds(state).has(videoId) : false));

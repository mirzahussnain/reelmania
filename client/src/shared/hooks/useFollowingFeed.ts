import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLazyFetchFollowingVideosQuery } from "../../utils/store/features/video/videoApi";
import { VideoType } from "../../types";
import { toast } from "react-toastify";

/**
 * Following feed — reverse-chronological videos from creators the user follows.
 *
 * Unlike the For You feed (Redis-queued, stored in the video slice), this feed is
 * a straightforward cursor-paginated list, so it owns its own local state here
 * rather than the global store. Returns the videos plus load flags; the page
 * wires `inView` on the last card to page forward.
 */
export const useFollowingFeed = (inView: boolean) => {
  const { getToken, isSignedIn } = useAuth();
  const [fetchFollowing, { isLoading, isFetching }] = useLazyFetchFollowingVideosQuery();

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // Guards a page request from firing again before the previous one resolves.
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (nextCursor?: string) => {
      if (!isSignedIn || loadingRef.current) return;
      loadingRef.current = true;
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetchFollowing({ token, cursor: nextCursor }).unwrap();
        const page = res?.data ?? [];

        setVideos((prev) => (nextCursor ? [...prev, ...page] : page));
        setCursor(res?.meta?.nextCursor ?? undefined);
        setHasMore(Boolean(res?.meta?.nextCursor));
      } catch {
        toast.error("Failed to load your Network feed");
      } finally {
        loadingRef.current = false;
      }
    },
    [isSignedIn, getToken, fetchFollowing]
  );

  // Initial load
  useEffect(() => {
    loadPage(undefined);
  }, [loadPage]);

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasMore && !loadingRef.current && cursor) {
      loadPage(cursor);
    }
  }, [inView, hasMore, cursor, loadPage]);

  return { videos, isLoading, isFetching, hasMore };
};

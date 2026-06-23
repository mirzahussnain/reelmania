import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAppDispatch } from "../../utils/hooks/storeHooks";
import { setForYouVideos, appendForYouVideos } from "../../utils/store/features/video/videoSlice";
import { useLazyFetchForYouVideosQuery, useLazyFetchAllVideosQuery } from "../../utils/store/features/video/videoApi";
import { toast } from "react-toastify";

export const useInfiniteFeed = (inView: boolean) => {
  const { getToken, isSignedIn } = useAuth();
  const dispatch = useAppDispatch();
  
  const [fetchForYou, { isLoading: isForYouLoading, isFetching: isForYouFetching }] = useLazyFetchForYouVideosQuery();
  const [fetchAll, { isLoading: isAllLoading, isFetching: isAllFetching }] = useLazyFetchAllVideosQuery();

  const isLoading = isSignedIn ? isForYouLoading : isAllLoading;
  const isFetching = isSignedIn ? isForYouFetching : isAllFetching;

  const [hasMore, setHasMore] = useState(true);

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
      if (!isSignedIn) {
        fetchAll({}).unwrap().then((res) => {
          if (res?.videos) {
            dispatch(setForYouVideos(res.videos));
            setHasMore(res.videos.length > 0);
          }
        }).catch(() => toast.error("Failed to fetch trending videos"));
        return;
      }

      const token = await getToken();
      if (!token) return; 

      fetchForYou({ token }).unwrap().then((res) => {
        if (res?.videos) {
          dispatch(setForYouVideos(res.videos));
          setHasMore(res.videos.length > 0);
        }
      }).catch(() => toast.error("Failed to fetch personalized feed"));
    }
    loadInitial();
  }, [getToken, isSignedIn, dispatch, fetchAll, fetchForYou]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      const loadMore = async () => {
        if (!isSignedIn) {
           setHasMore(false); 
           return;
        }

        const token = await getToken();
        if (!token) return;

        fetchForYou({ token }).unwrap().then((res) => {
          if (res?.videos?.length > 0) {
            dispatch(appendForYouVideos(res.videos));
            setHasMore(true);
          } else {
            setHasMore(false);
          }
        }).catch(() => toast.error("Failed to fetch more videos"));
      }
      loadMore();
    }
  }, [inView, hasMore, isFetching, fetchForYou, dispatch, getToken, isSignedIn]);

  return { isLoading, isFetching, hasMore };
};

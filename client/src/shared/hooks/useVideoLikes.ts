import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { VideoLikes } from "../../types";
import {
  useLazyGetLikesByVideoIdQuery,
  useUpdateLikesMutation,
} from "../../utils/store/features/video/videoApi";
import { useSocket } from "../providers/SocketProvider";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";

/**
 * Likes for a single video: initial load, the like/unlike toggle, and live
 * updates via the shared socket. Split out of the old useVideoRealtime so likes
 * and comments are independent, composable concerns.
 */
export const useVideoLikes = (videoId: string | undefined) => {
  const [getVideoLikes] = useLazyGetLikesByVideoIdQuery();
  const [updateLikes] = useUpdateLikesMutation();
  const { token } = useAppSelector((state: RootState) => state.auth);
  const user = useAppSelector((state: RootState) => state.user);
  const { socket, joinVideo, leaveVideo } = useSocket();

  const [likes, setLikes] = useState<VideoLikes[]>();
  const [pending, setPending] = useState(false);

  const handleLikes = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (!token || !user) {
        toast.error("Sign In Required");
        return;
      }
      if (!videoId) {
        toast.error("Video Id is missing");
        return;
      }

      setPending(true);
      const userData = { userId: user?.id, userName: user?.username };
      const query = await updateLikes({ videoId, userData, token }).unwrap();

      if (query?.updatedLikes) {
        setLikes(query.updatedLikes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!videoId) return;
    getVideoLikes(videoId)
      .unwrap()
      .then((query) => {
        if (query?.likes) setLikes(query.likes);
      })
      .catch((err) => console.error(err));
  }, [videoId, getVideoLikes]);

  // Live updates
  useEffect(() => {
    if (!socket || !videoId) return;
    joinVideo(videoId);

    const handleLikesChange = ({ updatedLikes, videoId: incomingId }: any) => {
      if (incomingId == videoId && updatedLikes) {
        setLikes(updatedLikes);
      }
    };
    socket.on(SOCKET_EVENTS.LIKES_CHANGED, handleLikesChange);

    return () => {
      socket.off(SOCKET_EVENTS.LIKES_CHANGED, handleLikesChange);
      leaveVideo(videoId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, videoId]);

  return { likes, handleLikes, pending, token, user };
};

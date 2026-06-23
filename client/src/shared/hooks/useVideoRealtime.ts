import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CommentType, VideoLikes } from "../../types";
import { useLazyGetCommentsByVideoIdQuery, useLazyGetLikesByVideoIdQuery, useUpdateLikesMutation } from "../../utils/store/features/video/videoApi";
import { useSocket } from "../providers/SocketProvider";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";

export const useVideoRealtime = (videoId: string | undefined) => {
  const [getVideoLikes] = useLazyGetLikesByVideoIdQuery();
  const [getComments] = useLazyGetCommentsByVideoIdQuery();
  const [updateLikes] = useUpdateLikesMutation();
  const { token } = useAppSelector((state: RootState) => state.auth);
  const user = useAppSelector((state: RootState) => state.user);

  const [pending, setPending] = useState(false);
  const [likes, setLikes] = useState<VideoLikes[]>();
  const [comments, setComments] = useState<CommentType[]>([]);
  const { socket, joinVideo, leaveVideo } = useSocket();

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

  useEffect(() => {
    const fetchLikes = async (id: string) => {
      try {
        const query = await getVideoLikes(id).unwrap();
        if (query && query?.likes) {
          setLikes(query?.likes);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchComments = async (id: string) => {
      try {
        const query = await getComments(id).unwrap();
        if (query && query?.comments) {
          let videoComments = [...query?.comments];
          setComments(videoComments.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()));
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (videoId) {
      fetchLikes(videoId);
      fetchComments(videoId);
    }
  }, [videoId, getVideoLikes, getComments]);

  useEffect(() => {
    if (!socket || !videoId) return;

    joinVideo(videoId);

    const handleLikesChange = ({ updatedLikes, videoId: incomingId }: any) => {
      if (incomingId == videoId && updatedLikes) {
        setLikes(updatedLikes);
      }
    };
    const handleCommentAdded = ({ newComment, videoId: incomingId }: any) => {
      if (incomingId === videoId) {
        setComments((prevComments) => [newComment, ...prevComments]);
      }
    };

    socket.on(SOCKET_EVENTS.LIKES_CHANGED, handleLikesChange);
    socket.on(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);

    return () => {
      socket.off(SOCKET_EVENTS.LIKES_CHANGED, handleLikesChange);
      socket.off(SOCKET_EVENTS.COMMENT_ADDED, handleCommentAdded);
      leaveVideo(videoId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, videoId]);

  return { handleLikes, likes, comments, pending, token, user };
};

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CommentType, VideoLikes } from "../../types";
import { useLazyGetCommentsByVideoIdQuery, useLazyGetLikesByVideoIdQuery, useUpdateLikesMutation } from "../../utils/store/features/video/videoApi";
import { connectSocket } from "../../utils/functions/socket";
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
  const socket = token ? connectSocket(token) : null;

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
      await updateLikes({ videoId, userData, token }).unwrap();
    } catch (err) {
      console.log(err);
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
        console.log(err);
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
        console.log(err);
      }
    };

    if (videoId) {
      fetchLikes(videoId);
      fetchComments(videoId);
    }
  }, [videoId, getVideoLikes, getComments]);

  useEffect(() => {
    try {
      if (socket) {
        if (socket.connected) return;
        socket.connect();
        socket.on("likesChange", ({ updatedLikes, videoId: returnedVideoId }) => {
          if (returnedVideoId == videoId && updatedLikes) {
            setLikes(updatedLikes);
          }
        });
        socket.on("newCommentAdded", ({ newComment }) => {
          setComments((prevComments) => [newComment, ...prevComments]);
        });
      }
      return () => {
        if (socket) {
          socket.off("likesChange");
          socket.off("newCommentAdded");
          socket.disconnect();
        }
      };
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message || "Socket Error");
      } else {
        toast.error("Socket Error");
      }
    }
  }, [socket, videoId]);

  return { handleLikes, likes, comments, pending, token, user };
};

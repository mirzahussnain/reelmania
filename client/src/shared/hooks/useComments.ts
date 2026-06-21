import { useState, useEffect, ChangeEvent } from "react";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import { useAddNewCommentMutation, useLazyGetCommentsByVideoIdQuery } from "../../utils/store/features/video/videoApi";
import { connectSocket } from "../../utils/functions/socket";
import { toast } from "react-toastify";
import { CommentType, VideoType } from "../../types";

export const useComments = (video: VideoType) => {
  const user = useAppSelector((state: RootState) => state.user);
  const token = useAppSelector((state: RootState) => state.auth.token);
  
  const [commentText, setCommentText] = useState("");
  const [videoComments, setVideoComments] = useState<CommentType[]>([]);
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState(false);

  const [postComment] = useAddNewCommentMutation();
  const [getComments, { isFetching: isCommentsLoading }] = useLazyGetCommentsByVideoIdQuery();
  
  const socket = token ? connectSocket(token) : null;

  // Handle Submit
  const handleSumbit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setPending(true);
      if (!commentText.trim()) throw new Error("Please write something first.");

      const comment: CommentType = {
        author: {
          id: user?.id,
          username: user?.username,
          avatar_url: user?.avatar_url,
        },
        posted_at: new Date(),
        text: commentText,
      };

      if (!video?.id) throw new Error("Video ID is missing.");
      if (!token) throw new Error("Token is missing.");
      
      const query = await postComment({
        comment,
        videoId: video?.id,
        token,
      }).unwrap();
      
      if (query) {
        setCommentText("");
        toast.success(query?.message);
        setVideoComments((prev) => [query?.newComments, ...prev]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment.");
    } finally {
      setPending(false);
    }
  };

  // Fetch initial comments
  useEffect(() => {
    if (video?.id) {
      const fetchComments = async (videoId: string) => {
        try {
          const query = await getComments(videoId).unwrap();
          if (query?.comments) {
            setVideoComments(query.comments);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchComments(video.id);
    }
  }, [video?.id, getComments]);

  // Sort comments based on filter
  useEffect(() => {
    setVideoComments((prev) => {
      const sorted = [...prev].sort((a, b) => {
        return filter 
          ? new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
          : new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
      });
      return sorted;
    });
  }, [filter]);

  // Socket listener for live comments
  useEffect(() => {
    if (!socket) return;
    try {
      if (!socket.connected) socket.connect();
      
      socket.on("newCommentAdded", ({ newComment, videoId }) => {
        if (newComment && video?.id === videoId) {
          setVideoComments((prev) => [newComment, ...prev]);
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to socket.");
    }

    return () => {
      socket.off("newCommentAdded");
      socket.disconnect();
    };
  }, [socket, video?.id]);

  return {
    user,
    commentText,
    setCommentText,
    videoComments,
    pending,
    filter,
    setFilter,
    handleSumbit,
    isCommentsLoading
  };
};

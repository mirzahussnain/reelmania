import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { connectSocket } from "../../utils/functions/socket";
import {
  useGetUserProfileQuery,
  useLazyGetUserFollowersQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserFollowerMutation,
} from "../../utils/store/features/user/userApi";
import {
  useLazyFetchVideoByIdQuery,
  useLazyGetLikesByVideoIdQuery,
} from "../../utils/store/features/video/videoApi";
import { VideoType, userType, VideoLikes } from "../../types";

export const useVideoInfo = () => {
  const { videoId } = useParams();
  const locationState = useLocation().state as VideoType;
  
  const [videoState, setVideoState] = useState<VideoType | null>(locationState || null);
  const [user, setUser] = useState<userType | null>(useAppSelector((state: RootState) => state.user));
  const [likes, setLikes] = useState<VideoLikes[]>([]);
  const [followStatus, setFollowStatus] = useState<boolean>(false);

  const { token } = useAppSelector((state: RootState) => state.auth);
  const { isSignedIn } = useAuth();
  const socket = token ? connectSocket(token) : null;

  const { data: videoUser } = useGetUserProfileQuery(videoState?.uploaded_by?.id, {
    skip: !videoState?.uploaded_by?.id
  });

  const [fetchFollowers] = useLazyGetUserFollowersQuery();
  const [followUser] = useUpdateUserFollowerMutation();
  const [getVideo] = useLazyFetchVideoByIdQuery();
  const [getUser] = useLazyGetUserProfileQuery();
  const [getLikes] = useLazyGetLikesByVideoIdQuery();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFollow = async () => {
    try {
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      if (!user?.id || !videoUser?.body?.id) {
        toast.error("User ID is missing.");
        return;
      }
      const query = await followUser({
        followerId: user.id,
        followingId: videoUser.body.id,
        token,
      }).unwrap();
      
      if (query) setFollowStatus(query.result);
    } catch (err: any) {
      toast.error(String(err));
    }
  };

  const captureVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => { video.currentTime = 1; };
    const handleSeeked = () => captureVideoFrame();

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [videoState?.video_url]);

  useEffect(() => {
    if (!socket) return;
    try {
      if (!socket.connected) socket.connect();
      socket.on("likesChange", ({ updatedLikes, videoId: retVideoId }) => {
        if (retVideoId === videoState?.id && updatedLikes) {
          setLikes(updatedLikes);
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Socket Error");
    }
    return () => {
      socket.off("likesChange");
      socket.disconnect();
    };
  }, [socket, videoState?.id]);

  useEffect(() => {
    const initData = async () => {
      if (!videoState && videoId) {
        const query = await getVideo(videoId).unwrap();
        if (query?.video) setVideoState(query.video);
      }
      if (videoState && !user?.id) {
        const query = await getUser(videoState.uploaded_by?.id).unwrap();
        if (query?.body) setUser(query.body);
      }
      if (videoState?.id) {
        const query = await getLikes(videoState.id).unwrap();
        if (query?.likes) setLikes(query.likes);
      }
    };
    initData();
  }, [videoId]);

  useEffect(() => {
    const checkFollowers = async () => {
      if (videoUser?.body?.id) {
        const query = await fetchFollowers(videoUser.body.id).unwrap();
        if (query?.result) {
          setFollowStatus(query.result.some((f: any) => f?.follower_id === user?.id));
        }
      }
    };
    checkFollowers();
  }, [videoUser, user?.id]);

  return {
    videoState,
    videoUser,
    user,
    likes,
    followStatus,
    isSignedIn,
    videoRef,
    canvasRef,
    handleFollow
  };
};

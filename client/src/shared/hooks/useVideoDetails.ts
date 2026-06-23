import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useAppSelector } from "../../utils/hooks/storeHooks";
import { RootState } from "../../utils/store/store";
import { useGetUserProfileQuery } from "../../utils/store/features/user/userApi";
import { useLazyFetchVideoByIdQuery } from "../../utils/store/features/video/videoApi";
import { VideoType } from "../../types";

/**
 * Resolves a single video and its uploader for the VideoInfo page: uses the
 * router location state when present, otherwise fetches by id. Also owns the
 * <video>/<canvas> refs and the blurred-frame capture used for the backdrop.
 */
export const useVideoDetails = () => {
  const { videoId } = useParams();
  const locationState = useLocation().state as VideoType;

  const [videoState, setVideoState] = useState<VideoType | null>(locationState || null);
  // Derive the current user directly from the store (live) rather than copying
  // it into local state once, which previously went stale.
  const user = useAppSelector((state: RootState) => state.user);
  const { isSignedIn } = useAuth();

  const { data: videoUser } = useGetUserProfileQuery(videoState?.uploaded_by?.id, {
    skip: !videoState?.uploaded_by?.id,
  });

  const [getVideo] = useLazyFetchVideoByIdQuery();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.currentTime = 1;
    };
    const handleSeeked = () => captureVideoFrame();

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [videoState?.video_url]);

  // Fetch the video by id if we arrived without router state.
  useEffect(() => {
    const initData = async () => {
      if (!videoState && videoId) {
        try {
          const query = await getVideo(videoId).unwrap();
          if (query?.video) setVideoState(query.video);
        } catch (err) {
          console.error(err);
        }
      }
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return { videoState, videoUser, user, isSignedIn, videoRef, canvasRef };
};

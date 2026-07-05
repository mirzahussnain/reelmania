import React, { useState, useRef } from "react";
import { VideoType } from "../types";
import { useVideoPlayback } from "../shared/hooks/useVideoPlayback";
import { useCustomPlayer } from "../shared/hooks/useCustomPlayer";
import { useVideoLikes } from "../shared/hooks/useVideoLikes";
import { useComments } from "../shared/hooks/useComments";
import { useRegisterViewMutation } from "../utils/store/features/video/videoApi";
import { VideoActions } from "../shared/components/VideoActions";
import { VideoInfoOverlay } from "../shared/components/VideoInfoOverlay";
import { VideoControlsOverlay } from "../shared/components/VideoControlsOverlay";

const PlayerCard = ({
  video,
  setIsModalOpen,
}: {
  video: VideoType;
  setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void;
}) => {
  const videoRef = useVideoPlayback(setIsModalOpen);
  const playerControls = useCustomPlayer(videoRef as React.RefObject<HTMLVideoElement>);
  const { handleLikes, likes, pending, token, user } = useVideoLikes(video?.id);
  const { videoComments } = useComments(video);
  const [openShareModel, setOpenShareModel] = useState(false);

  // Register a single view the first time this clip actually starts playing.
  // The server dedupes per (video, viewer) too, but guarding here avoids a
  // needless request on every loop/replay. viewer id falls back to the signed-in
  // user; anonymous viewers are deduped server-side by IP.
  const [registerView] = useRegisterViewMutation();
  const viewedRef = useRef(false);
  const handlePlay = () => {
    if (viewedRef.current || !video?.id) return;
    viewedRef.current = true;
    registerView({ videoId: video.id, viewerId: user?.id || undefined });
  };

  return (
    <div className="relative w-full h-full lg:h-[85dvh] lg:rounded-2xl lg:flex lg:justify-center transition-all ease-in-out duration-300">
      <div className="relative w-full lg:w-auto lg:aspect-[9/16] h-full lg:rounded-2xl bg-scrim overflow-hidden glow-black group">
        <video
          ref={videoRef}
          className="w-full h-full object-cover video-control-hide peer"
          autoPlay={false}
          muted
          loop
          src={video?.video_url}
          poster={video?.thumbnail_url}
          onPlay={handlePlay}
          playsInline
        />

        {/* Custom Video Controls Overlay */}
        <VideoControlsOverlay {...playerControls} />

        <VideoInfoOverlay video={video} />
        
        <VideoActions
          video={video}
          videoId={video?.id as string}
          likes={likes}
          commentsLength={videoComments.length}
          handleLikes={handleLikes}
          pending={pending}
          user={user}
          token={token}
          setIsModalOpen={setIsModalOpen}
          openShareModel={openShareModel}
          setOpenShareModel={setOpenShareModel}
        />
      </div>
    </div>
  );
};

export default React.memo(PlayerCard, (prevProps, nextProps) => {
  return prevProps.video.id === nextProps.video.id;
});

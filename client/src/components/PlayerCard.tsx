import React, { useState } from "react";
import { VideoType } from "../types";
import { useVideoPlayback } from "../shared/hooks/useVideoPlayback";
import { useCustomPlayer } from "../shared/hooks/useCustomPlayer";
import { useVideoRealtime } from "../shared/hooks/useVideoRealtime";
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
  const { handleLikes, likes, comments, pending, token, user } = useVideoRealtime(video?.id);
  const [openShareModel, setOpenShareModel] = useState(false);

  return (
    <div className="relative w-full h-full lg:h-[85dvh] lg:rounded-2xl lg:flex lg:justify-center transition-all ease-in-out duration-300">
      <div className="relative w-full lg:w-auto lg:aspect-[9/16] h-full lg:rounded-2xl bg-black overflow-hidden glow-black group">
        <video
          ref={videoRef}
          className="w-full h-full object-cover video-control-hide peer"
          autoPlay={false}
          muted
          loop
          src={video?.video_url}
          playsInline
        />

        {/* Custom Video Controls Overlay */}
        <VideoControlsOverlay {...playerControls} />

        <VideoInfoOverlay video={video} />
        
        <VideoActions
          videoId={video?.id as string}
          likes={likes}
          commentsLength={comments.length}
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

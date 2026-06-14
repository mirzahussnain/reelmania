import React, { useState } from "react";
import { VideoType } from "../types";
import { useVideoPlayback } from "../shared/hooks/useVideoPlayback";
import { useVideoRealtime } from "../shared/hooks/useVideoRealtime";
import { VideoActions } from "../shared/components/VideoActions";
import { VideoInfoOverlay } from "../shared/components/VideoInfoOverlay";

const PlayerCard = ({
  video,
  setIsModalOpen,
}: {
  video: VideoType;
  setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void;
}) => {
  const videoRef = useVideoPlayback(setIsModalOpen);
  const { handleLikes, likes, comments, pending, token, user } = useVideoRealtime(video?.id);
  const [openShareModel, setOpenShareModel] = useState(false);

  return (
    <div className="lg:static relative w-full lg:h-[88vh] h-[90vh] lg:rounded-l-2xl lg:flex lg:justify-center transition-all ease-in-out duration-200">
      <div className="relative w-full lg:w-11/12 h-full lg:rounded-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-fill lg:rounded-2xl video-control-hide peer"
          autoPlay={false} // Controlled by intersection observer
          muted
          loop
          src={video?.video_url}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
        />

        <VideoInfoOverlay video={video} />
      </div>

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
  );
};

export default React.memo(PlayerCard, (prevProps, nextProps) => {
  return prevProps.video.id === nextProps.video.id;
});

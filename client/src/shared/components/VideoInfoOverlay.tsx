import React from "react";
import { Link } from "react-router-dom";
import { dateFormatter } from "../../utils/functions/formatter";
import { VideoType } from "../../types";

interface VideoInfoOverlayProps {
  video: VideoType;
}

export const VideoInfoOverlay: React.FC<VideoInfoOverlayProps> = ({ video }) => {
  return (
    <section className="w-[20rem] h-[7rem] absolute text-white left-0 peer-hover:bottom-16 bottom-3 lg:right-50 lg:left-50 lg: flex flex-col justify-center items-start px-3 transition-all duration-75 ease-linear">
      <h2 className="w-full font-semibold">
        <Link to={`/users/@${video?.uploaded_by?.username}`} className="hover:underline mr-1">
          {video?.uploaded_by?.username}
        </Link>
        .
        <span className="ml-1 text-zinc-400 text-sm">
          {dateFormatter(new Date(video?.uploaded_at))}
        </span>
      </h2>
      <p className="w-full text-sm text-ellipsis text-nowrap overflow-hidden hover:text-wrap hover:overflow-y-auto peer">
        {video?.title}
      </p>
      <p className="text-sm flex justify-center items-center flex-wrap">
        {video.hashtags.map((hashtag, index) => (
          <span className={`ml-1`} key={index}>
            #{hashtag}
          </span>
        ))}
      </p>
    </section>
  );
};

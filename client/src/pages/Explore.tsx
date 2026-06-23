import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { VideoType } from "../types";
import { dateFormatter } from "../utils/functions/formatter";
import { Link, useNavigate } from "react-router-dom";
import { useFetchAllVideosQuery } from "../utils/store/features/video/videoApi";

const Explore = () => {
  const navigateTo = useNavigate();
  // The active query args ARE the source of truth. RTK Query caches each
  // distinct {q, type} combination, so search is just changing these args —
  // no separate filtered-results slice to maintain.
  const [searchArgs, setSearchArgs] = useState<{ q?: string; type?: string }>({});
  const { data, isFetching } = useFetchAllVideosQuery(searchArgs);
  const videos: VideoType[] = data?.videos ?? [];

  return (
    <div className="min-h-dvh w-full pt-20 pb-24 flex flex-col items-center justify-start overflow-y-auto scrollbar-hide bg-gradient-to-br from-surface to-surface-container">
      <div className="w-full h-full flex justify-center items-start">
        <SearchBar
          onSearch={(q, type) => setSearchArgs({ q, type })}
          onClear={() => setSearchArgs({})}
        />
      </div>
      <div className="w-full h-full flex flex-col items-center justify-start px-5 lg:py-6 py-3 mb-16">
        {isFetching ? (
          <p className="text-center text-on-surface-variant text-lg">
            Loading…
          </p>
        ) : videos?.length === 0 ? (
          <p className="text-center text-on-surface-variant text-lg">
            No videos to display
          </p>
        ) : (
          <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 px-2 md:px-6">
            {videos?.map((video, index) => (
              <div
                onClick={() => navigateTo(`/videos/${video?.id}`, { state: video })}
                key={index}
                className="card-solid w-full aspect-[9/16] rounded-xl duration-700 transition-all cursor-pointer relative group overflow-hidden hover:scale-[1.02]"
              >
                <video
                  className="w-full h-full object-cover"
                  src={video?.video_url}
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                  muted
                />
                <div className="absolute bottom-2 right-0 left-4 w-full flex flex-col items-start justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
                  <div className="w-full flex justify-start items-center text-on-media">
                    <Link
                      to={`/users/@${video?.uploaded_by?.username}`}
                      className="text-lg font-medium tracking-wider text-on-media hover:underline"
                    >
                      @{video?.uploaded_by?.username}
                    </Link>
                    <p className="mx-1">.</p>
                    <span className="text-xs text-on-media-dim">
                      {dateFormatter(new Date(video?.uploaded_at))}
                    </span>
                  </div>
                  <h2 className="text-sm tracking-wide text-on-media font-thin">
                    {video?.title}
                  </h2>
                  <span className="w-full flex justify-start items-center text-on-media">
                    {video?.hashtags?.map((hashtag, index) => (
                      <p key={index} className="mr-1">#{hashtag}</p>
                    ))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;

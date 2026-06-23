import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { VideoType } from "../types";
import { useNavigate } from "react-router-dom";
import { useFetchAllVideosQuery } from "../utils/store/features/video/videoApi";
import { EmptyState } from "../shared/components/ui/EmptyState";
import { VideoThumbnailCard } from "../shared/components/ui/VideoThumbnailCard";

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
          <EmptyState message="Loading…" />
        ) : videos?.length === 0 ? (
          <EmptyState message="No videos to display" />
        ) : (
          <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 px-2 md:px-6">
            {videos?.map((video, index) => (
              <VideoThumbnailCard
                key={index}
                video={video}
                variant="grid"
                onClick={() => navigateTo(`/videos/${video?.id}`, { state: video })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;

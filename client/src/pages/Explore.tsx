import { useState } from "react";
import SearchBar from "../components/SearchBar";
import { VideoType } from "../types";
import { dateFormatter } from "../utils/functions/formatter";
import { Link, useNavigate } from "react-router-dom";

const Explore = () => {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const navigateTo=useNavigate();
  return (
    <div className="h-screen w-screen lg:py-16 pt-20 flex flex-col items-center justify-center overflow-y-auto scrollbar-custom
    bg-gradient-to-br from-zinc-800/80 to-white/20 backdrop-filter backdrop-blur-2xl">
      <div className="w-full h-full flex justify-center items-start">
        <SearchBar setVideos={setVideos} />
      </div>
      <div className="w-full h-full flex flex-col items-center justify-start px-5 lg:py-6 py-3 mb-16">
        {videos?.length === 0  ? (
          <p className="text-center text-gray-600 text-lg">
            No videos to display
          </p>
        ) : (
          <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {videos?.map((video, index) => (
              <div
              onClick={()=>navigateTo(`/videos/${video?.id}`,{
                state:video
              })}
                key={index}
                className="w-26 h-52 rounded-xl duration-700 transition-all last:mb-20 cursor-pointer relative group overflow-hidden hover:scale-105 bg-slate-400"
              >
                <video
                  className="w-full h-full object-cover"
                  src={video?.video_url}
                  onMouseEnter={(e)=>e.currentTarget.play()}
                  onMouseLeave={(e)=>e.currentTarget.pause()}
                  muted
                />
                <div
                  className="absolute bottom-2 right-0 left-4 w-full flex flex-col items-start justify-center transform translate-y-full group-hover:translate-y-0
                                transition-transform duration-500 ease-in-out "
                >
                  <div className="w-full flex justify-start items-center text-white">
                    <Link
                      to={`/users/@${video?.uploaded_by?.username}`}
                      className="text-lg font-medium tracking-wider text-white hover:underline"
                    >
                      @{video?.uploaded_by?.username}
                    </Link>
                    <p className="mx-1">.</p>
                    <span className="text-xs text-zinc-400">
                      {dateFormatter(new Date(video?.uploaded_at))}
                    </span>
                  </div>
                  <h2 className="text-sm  tracking-wide text-white font-thin">
                    {video?.title}
                  </h2>
                  <span className="w-full flex justify-start items-center text-white">
                    {video?.hashtags?.map((hashtag,index)=>(
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

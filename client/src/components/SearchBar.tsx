import { FaSearch, FaUndo } from "react-icons/fa";
import { FormEvent, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import {
  clearFilteredVideos,
  setFilteredVideos,
} from "../utils/store/features/video/FilteredVideoSlice.ts";
import { VideoType } from "../types.ts";
import { useLazyFetchAllVideosQuery } from "../utils/store/features/video/videoApi.ts";
import { setAllVideos } from "../utils/store/features/video/videoSlice.ts";

export const SearcBar = ({
  setVideos,
}: {
  setVideos: React.Dispatch<React.SetStateAction<VideoType[]>>;
}) => {
  const allVideos = useAppSelector((state: RootState) => state?.video?.videos);
  const [getVideos, response] = useLazyFetchAllVideosQuery();
  const [filter, setFilter] = useState<string>("hashtag");
  const [filterMode, setFilterMode] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string | null>(null);
  const filteredVideos = useAppSelector(
    (state: RootState) => state.filteredVideo
  );
  
  
  const dispatch = useAppDispatch();
  
  useEffect(() => {
      if (allVideos.length === 0) {
      getVideos({}).unwrap();
      }
  }, [allVideos]);

  useEffect(()=>{
    if(response.isSuccess){
       
       dispatch(setAllVideos(response?.data?.videos))
      dispatch(setFilteredVideos(response?.data?.videos))
    }
  },[response])
  
  useEffect(() => {
    if (!filterMode) {
      setVideos(allVideos);
    } else {
      setVideos(filteredVideos);
    }
  }, [filter, dispatch, filteredVideos,allVideos]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (filter === "hashtag" && searchText) {
      const filteredVideos = allVideos?.filter((video) =>
        video.hashtags.some((hashtag: string) => hashtag.includes(searchText))
      );
      if (filteredVideos.length > 0) {
        dispatch(setFilteredVideos(filteredVideos));
        alert("Videos Found");
        setFilterMode(true);
      } else {
        alert("Videos with given hashtags are not found");
      }
    } else if (filter === "title" && searchText) {
      const filteredVideos = allVideos?.filter((video) =>
        video.title.includes(searchText)
      );
      if (filteredVideos.length > 0) {
        dispatch(setFilteredVideos(filteredVideos));
        alert("Videos Found");
        setFilterMode(true);
      } else {
        alert("Videos with given title are not found");
      }
    }
  };

  const handleClearFilter = () => {
    dispatch(clearFilteredVideos(allVideos));
    setSearchText("");
    alert(`Filter Cleared`);
    setFilterMode(false);
  };
  return (
    <form
      className={`lg:w-[40rem] h-[8rem] lg:h-[3rem]  text-white flex flex-col lg:flex-row justify-center items-center mt-20 `}
      onSubmit={(e) => handleSubmit(e)}
    >
      <div className="w-full h-full bg-white  flex justify-end item-center mt-5 lg:my-0 rounded-full">
        <select
          className={`w-32 rounded-l-full bg-red-600 text-white outline-0 px-1 font-medium hidden lg:block  tracking-wide text-xl text-center`}
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
        >
          <option value={`hashtag`}>Hashtag</option>
          <option value={`title`}>Title</option>
        </select>
        <input
          type={`text`}
          className={`w-full bg-transparent outline-none text-zinc-600 px-2 placeholder:text-center text-lg
                font-medium`}
          placeholder={`Search videos by ${filter}`}
          value={searchText || ""}
          onChange={(e) => setSearchText(e.target.value)}
        />
        {filterMode ? (
          <button
            className={`p-6 py-1 bg-red-600 w-10 h-full rounded-r-full text-white text-xl`}
            type={"button"}
            onClick={handleClearFilter}
          >
            <FaUndo />
          </button>
        ) : (
          <button
            className={`px-6 bg-red-600  h-full rounded-r-full text-white text-xl`}
            type="submit"
          >
            <FaSearch />
          </button>
        )}
      </div>
      <div
        className={`w-full flex flex-col justify-center items-center px-3 lg:hidden`}
      >
        <h2 className={`text-center w-full text-sm`}>Filter By:</h2>
        <div className={`w-full flex justify-center items-center text-sm my-4`}>
          <label htmlFor="Hashtag" className={`mr-2`}>
            Hashtag
          </label>
          <input
            type={`radio`}
            name={`filter`}
            value={`hashtag`}
            onChange={(e) => setFilter(e.target.value)}
          />
          <label htmlFor="Title" className={`mx-2`}>
            Title
          </label>
          <input
            type={`radio`}
            name={`filter`}
            value={`title`}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
    </form>
  );
};

export default SearcBar;

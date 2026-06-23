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
import { setExploreVideos } from "../utils/store/features/video/videoSlice.ts";
import { FiFilter } from "react-icons/fi";

export const SearchBar = ({
  setVideos,
}: {
  setVideos: React.Dispatch<React.SetStateAction<VideoType[]>>;
}) => {
  const allVideos = useAppSelector((state: RootState) => state?.video?.exploreVideos);
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
  }, []);

  useEffect(() => {
    if (response.isSuccess && !filterMode) {
      dispatch(setExploreVideos(response?.data?.videos || []));
    }
  }, [response]);

  useEffect(() => {
    if (!filterMode) {
      setVideos(allVideos);
    } else {
      setVideos(filteredVideos);
    }
  }, [dispatch, filteredVideos, allVideos, filterMode]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchText) {
      try {
        const query = await getVideos({ q: searchText, type: filter }).unwrap();
        if (query?.videos?.length > 0) {
          dispatch(setFilteredVideos(query.videos));
          setFilterMode(true);
        } else {
          alert("Videos not found for this search");
        }
      } catch (err) {
        console.error(err);
        alert("Search failed");
      }
    }
  };

  const handleClearFilter = () => {
    dispatch(clearFilteredVideos(allVideos));
    setSearchText("");
    setFilterMode(false);
  };

  return (
    <form
      className="w-[90%] lg:w-[45rem] flex flex-col gap-4 mt-12 mb-8 z-10 animate-fade-in"
      onSubmit={(e) => handleSubmit(e)}
    >
      <div className="card-glass w-full flex items-center h-14 md:h-16 rounded-full overflow-hidden p-1 shadow-lg">
        {/* Desktop Filter Select */}
        <div className="hidden lg:flex items-center h-full px-4 border-r border-outline-variant/20">
          <FiFilter className="text-on-surface-variant mr-2" />
          <select
            className="bg-transparent text-on-surface outline-none font-medium text-sm cursor-pointer appearance-none uppercase tracking-widest"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          >
            <option value="hashtag" className="bg-surface">Hashtag</option>
            <option value="title" className="bg-surface">Title</option>
          </select>
        </div>

        {/* Search Input */}
        <input
          type="text"
          className="flex-1 h-full bg-transparent outline-none text-on-surface px-6 placeholder:text-on-surface-variant/50 text-sm md:text-base font-medium"
          placeholder={`Search immersive content by ${filter}...`}
          value={searchText || ""}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {/* Action Button */}
        {filterMode ? (
          <button
            className="h-full aspect-square flex items-center justify-center bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
            type="button"
            onClick={handleClearFilter}
            title="Clear Search"
          >
            <FaUndo className="text-xl" />
          </button>
        ) : (
          <button
            className="h-full px-6 flex items-center justify-center bg-primary text-on-primary rounded-full hover:glow-primary transition-all font-bold tracking-wide"
            type="submit"
          >
            <FaSearch className="text-lg md:mr-2" />
            <span className="hidden md:inline">Search</span>
          </button>
        )}
      </div>

      {/* Mobile Filter Options */}
      <div className="lg:hidden flex justify-center items-center gap-4 text-sm mt-2">
        <span className="text-on-surface-variant uppercase tracking-widest text-xs font-bold mr-2">Filter:</span>
        <label className={`flex items-center gap-2 cursor-pointer ${filter === 'hashtag' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <input
            type="radio"
            name="filter"
            value="hashtag"
            checked={filter === 'hashtag'}
            onChange={(e) => setFilter(e.target.value)}
            className="accent-primary"
          />
          Hashtag
        </label>
        <label className={`flex items-center gap-2 cursor-pointer ${filter === 'title' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <input
            type="radio"
            name="filter"
            value="title"
            checked={filter === 'title'}
            onChange={(e) => setFilter(e.target.value)}
            className="accent-primary"
          />
          Title
        </label>
      </div>
    </form>
  );
};

export default SearchBar;

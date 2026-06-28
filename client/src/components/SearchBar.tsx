import { useState, useEffect } from "react";

export const SearchBar = ({
  onSearch,
  onClear,
}: {
  onSearch: (q: string, type: string) => void;
  onClear: () => void;
}) => {
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchText.trim();
      if (q) {
        onSearch(q, "hashtag");
      } else {
        onClear();
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchText, onSearch, onClear]);

  return (
    <div className="w-full relative">
      <input
        type="text"
        className="w-full h-12 bg-surface-container-high/30 border border-outline-variant/30 rounded-full px-6 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:border-outline-variant/60 focus:bg-surface-container-high/50 focus:outline-none transition-all"
        placeholder="Search creators, tags, or videos..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;

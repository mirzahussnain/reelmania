import React from "react";
import { FiSearch } from "react-icons/fi";
import { cn } from "../../utils/cn";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Boxed search input (icon + field). The shared primitive for in-page,
 * scoped search (Marketplace asset query, Vault library search). For the
 * Discover pill-style search see `components/SearchBar.tsx`.
 */
export const SearchField: React.FC<SearchFieldProps> = ({ value, onChange, placeholder, className }) => (
  <div className={cn("flex items-center gap-2 bg-surface-container rounded-lg px-4 py-2.5 border border-outline-variant/20", className)}>
    <FiSearch className="text-on-surface-variant shrink-0" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent w-full outline-none text-sm text-on-surface placeholder:text-on-surface-variant font-inter"
    />
  </div>
);

export default SearchField;

import { Search, X } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  dark = false,
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
          dark ? "text-white/30" : "text-ink/35"
        }`}
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${dark ? "input-dark" : "input"} pl-10 pr-9`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition ${
            dark ? "text-white/30 hover:text-white" : "text-ink/30 hover:text-ink"
          }`}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

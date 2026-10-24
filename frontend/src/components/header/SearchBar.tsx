import { Search } from "lucide-react";

type SearchBarProps = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  onSearch: (e: React.FormEvent) => void;
  className?: string;
  formClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  className,
  formClassName,
  inputClassName,
  buttonClassName,
}: SearchBarProps) {
  return (
    <div className={className}>
      <form
        onSubmit={onSearch}
        className={formClassName}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar produtos..."
          className={inputClassName}
        />

        <button
          type="submit"
          className={buttonClassName}
        >
         <Search size={18} />
        </button>
      </form>
    </div>
  );
}
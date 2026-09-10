import { useRef } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SearchUser } from '../../types';

interface SearchDropdownProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchUser[];
  loading: boolean;
  onSelectUser: (user: SearchUser) => void;
  selectedUsernames: string[];
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  onQueryChange,
  results,
  loading,
  onSelectUser,
  selectedUsernames,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const showDropdown = query.length > 0 && (loading || results.length > 0);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          id="user-search"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search users by username…"
          className="input-field pl-11 pr-4"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 overflow-hidden animate-slide-up">
          {loading ? (
            <div className="flex items-center gap-3 px-4 py-4 text-slate-400 dark:text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-slate-400 dark:text-slate-500 text-sm text-center">
              No users found for "{query}"
            </div>
          ) : (
            <ul className="py-1 max-h-64 overflow-y-auto">
              {results.map((user) => {
                const isSelected = selectedUsernames.includes(user.username);
                return (
                  <li
                    key={user._id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    {/* Click user row to add as tag */}
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => onSelectUser(user)}
                      disabled={isSelected}
                    >
                      {user.pfpUrl ? (
                        <img src={user.pfpUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="avatar w-9 h-9 text-xs flex-shrink-0">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.username}</p>
                      </div>
                      {isSelected && (
                        <span className="ml-auto badge bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex-shrink-0">
                          Added
                        </span>
                      )}
                    </button>

                    {/* Arrow to navigate to profile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${encodeURIComponent(user.username)}`);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary-100 dark:hover:bg-primary-950/50 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                      title={`View ${user.username}'s profile`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;

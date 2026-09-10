import { X } from 'lucide-react';
import type { SearchUser } from '../../types';

interface UserTagProps {
  user: SearchUser;
  onRemove: (username: string) => void;
}

const UserTag: React.FC<UserTagProps> = ({ user, onRemove }) => {
  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <span className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold animate-fade-in">
      {user.pfpUrl ? (
        <img src={user.pfpUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
      ) : (
        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
          {getInitials(user.name)}
        </span>
      )}
      {user.username}
      <button
        onClick={() => onRemove(user.username)}
        className="ml-0.5 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};

export default UserTag;

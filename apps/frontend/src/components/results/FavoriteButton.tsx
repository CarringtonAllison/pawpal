import { useSessionStore } from '../../store/sessionStore.js';
import { api } from '../../api/client.js';

interface FavoriteButtonProps {
  petId: string;
}

export function FavoriteButton({ petId }: FavoriteButtonProps) {
  const { sessionId, favorites, toggleFavorite } = useSessionStore();
  const isFavorited = favorites.includes(petId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(petId);

    // Optimistic update — persist in background
    if (sessionId) {
      const updated = isFavorited
        ? favorites.filter((id) => id !== petId)
        : [...favorites, petId];
      try {
        await api.saveFavorites(sessionId, updated);
      } catch {
        // Revert on failure
        toggleFavorite(petId);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
    >
      <svg
        className={`w-5 h-5 transition-colors ${isFavorited ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`}
        viewBox="0 0 24 24"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

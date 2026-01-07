'use client';

import { Plus, Check, ThumbsUp, Trash2, Eye, EyeOff } from 'lucide-react';
import { addToWatchList, removeFromWatchList, toggleFavorite, removeFromContinueWatching } from '@/lib/actions';
import { useProfile } from '@/components/ProfileProvider';
import { useRouter } from 'next/navigation';
import { useMediaItem, useUserMedia } from './UserMediaProvider';

type Props = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  releaseDate?: string;
  posterPath: string;
  voteAverage?: number;
  genres?: string; // JSON string
  totalDuration?: number;
  className?: string; // Allow minimal styling override
  minimal?: boolean; // For cards (just +)
  showStatusToggle?: boolean; // To allow marking as completed/remove from watching
  onStatusChange?: () => void; // Callback provided by parent to maybe re-fetch or hide item
};

export default function WatchListButton({ tmdbId, mediaType, title, releaseDate, posterPath, voteAverage, genres, totalDuration, className, minimal = false, showStatusToggle = false, onStatusChange }: Props) {
  const { currentProfile } = useProfile();
  const item = useMediaItem(tmdbId);
  const { updateLocalMedia } = useUserMedia();
  const router = useRouter();

  const isInWatchlist = !!(item?.status || item?.isFavorite); // Effectively tracking if we have any relationship
  // Actually, 'watchlist' usually implies 'plan_to_watch' OR 'watching'. 
  // Let's stick to the previous logic: "isInWatchlist" meant "we found a record in DB".
  // The previous checkStatus set isInWatchlist = true if record existed.
  const recordExists = !!item;
  const isFavorite = !!item?.isFavorite;
  const status = item?.status;

  // Optimistic updates helper
  const updateOptimistic = (updates: any) => {
    updateLocalMedia({ tmdbId, ...updates });
  };

  async function handleToggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click

    if (!currentProfile) {
      alert('Seleziona un profilo prima!');
      return;
    }

    // Determine current logical state for "Watchlist" (Plan to watch)
    // If it's already in plan_to_watch, remove it?
    // Or if it exists, remove it entirely?
    // Previous logic: if(isInWatchlist) remove; else add.
    // But isInWatchlist was true if ANY record existed.
    // If I have it as "watching", clicking the "+" logic removed it?
    // Let's replicate:
    if (recordExists) {
      // Remove from watchlist
      updateOptimistic({ status: null, isFavorite: false }); // Optimistic clear
      await removeFromWatchList(currentProfile.id, tmdbId);
      // Actual update will come from refresh if we triggered one, but optimistic is handled.
    } else {
      updateOptimistic({ status: 'plan_to_watch', isFavorite: false });
      await addToWatchList(currentProfile.id, {
        tmdbId,
        mediaType,
        title,
        releaseDate,
        posterPath,
        rating: voteAverage,
        status: 'plan_to_watch',
        totalDuration,
        genres
      });
    }
    router.refresh();
    if (onStatusChange) onStatusChange();
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentProfile) return;

    // Toggle favorite
    const newFav = !isFavorite;
    updateOptimistic({ isFavorite: newFav });

    if (!recordExists) {
        // If it didn't exist, we must create it.
        // We set status to 'plan_to_watch' implicitly if we are collecting it? 
        // Logic from before: if !isInWatchlist -> status = 'plan_to_watch'.
        updateOptimistic({ status: 'plan_to_watch' });
    }

    // Always update metadata (and ensure existence) preserving current status
    await addToWatchList(currentProfile.id, {
      tmdbId,
      mediaType,
      title,
      releaseDate,
      posterPath,
      rating: voteAverage,
      status: (status as any) || 'plan_to_watch',
      totalDuration,
      genres
    });

    await toggleFavorite(currentProfile.id, tmdbId, newFav);
    router.refresh();
    if (onStatusChange) onStatusChange();
  }

  async function handleRemoveFromContinueWatching(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentProfile) return;

    // Calculate progress percentage
    const progress = item?.progress || 0;
    const duration = item?.totalDuration || totalDuration || 1; // Avoid division by zero
    const percentage = progress / duration;
    
    // Determine new status: > 80% is completed, otherwise dropped
    // The user said: "se il contenuto ha progress a piu del 80% rispetto a total_duration lo stato va a watched invece che a dropped."
    // "se invece la percentuale è minore allora va a dropped."
    const newStatus = percentage > 0.8 ? 'completed' : 'dropped';

    // Optimistic update
    // We update to the new status. This will remove it from "Continue Watching" list (which filters for 'watching')
    // and correctly categorize it in the backend.
    updateOptimistic({ status: newStatus });
    
    // We use addToWatchList to update the record with the new status. 
    // This function handles upsert/update correctly and updates timestamp.
    await addToWatchList(currentProfile.id, {
        tmdbId,
        mediaType,
        title,
        releaseDate,
        posterPath,
        rating: voteAverage,
        status: newStatus,
        totalDuration,
        genres
    });
    
    // We might want to trigger a refresh to remove the card from the UI immediately if it's in a Continue Watching section
    router.refresh();
    if (onStatusChange) onStatusChange();
  }

  if (minimal) {
    return (
      <div className="flex flex-col gap-2">
        {/* 
                  REMOVED Plus/Check button as per request ("tieni solo il mi piace e togli il cuore/più").
                  User wants to keep just "Like".
                */}

        {/* Show EyeOff only if there is progress/watching status to allow removing it */}
        {(status === 'watching' || (item?.progress || 0) > 0) && (
          <button
            onClick={handleRemoveFromContinueWatching}
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-all z-10"
            title="Rimuovi da 'Continua a guardare'"
          >
            <EyeOff size={14} />
          </button>
        )}

        <button
          onClick={handleToggleFavorite}
          className={`p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 transition-all z-10 ${isFavorite ? 'text-red-500 bg-white/10 border-red-500' : 'text-white hover:bg-white hover:text-black'}`}
          title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        >
          <ThumbsUp size={14} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      <button
        onClick={handleToggleFavorite}
        className={`p-2 rounded-full border flex gap-2 items-center px-4 border-white/20 hover:bg-white/10 transition-colors ${isFavorite ? 'text-red-500 border-red-500/50' : 'text-white'}`}
        title="Mi piace"
      >
        Mi piace
        <ThumbsUp size={20} fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

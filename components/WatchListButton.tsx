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

  // Determine button states based on stricter rules
  let showContinueWatching = false;
  let continueWatchingIcon = <Eye size={14} />;
  let continueWatchingDisabled = false;
  let onContinueWatchingClick = (e: React.MouseEvent) => { };
  let continueWatchingTitle = "";

  const hasStatus = !!status;

  // Decide if we show the button
  // New Logic: 
  // If favorite: 
  //   - show if completed (Eye, Disabled)
  //   - show if watching (EyeOff, Enabled)
  //   - HIDE if dropped or plan_to_watch
  // If NOT favorite:
  //   - show if watching, plan_to_watch, dropped (basically if hasStatus)

  if (isFavorite) {
    if (status === 'completed') {
      showContinueWatching = true;
      continueWatchingIcon = <Eye size={14} />;
      continueWatchingDisabled = true;
      continueWatchingTitle = "Completato";
    } else if (status === 'watching' || (status === 'dropped' && false)) {
      // Note: user specifically said: "se dropped con is_favorite true allora non devi mostrare"
      // So we ONLY show if watching.
      showContinueWatching = true;
      continueWatchingIcon = <EyeOff size={14} />;
      continueWatchingDisabled = false;
      continueWatchingTitle = "Non seguire";
      onContinueWatchingClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentProfile) return;
        // If watching and favorite -> Drop/Remove from watching?
        const newStatus = 'dropped';
        updateOptimistic({ status: newStatus });
        await addToWatchList(currentProfile.id, {
          tmdbId, mediaType, title, releaseDate, posterPath, rating: voteAverage,
          status: newStatus, totalDuration, genres
        });
        router.refresh();
        if (onStatusChange) onStatusChange();
      };
    }
    // Implicitly: dropped and plan_to_watch -> showContinueWatching = false
  } else {
    // Not Favorite
    if (hasStatus) {
      showContinueWatching = true;

      if (status === 'completed') {
        continueWatchingIcon = <Eye size={14} />;
        continueWatchingDisabled = true;
        continueWatchingTitle = "Completato";
      } else if (status === 'dropped') {
        continueWatchingIcon = <Eye size={14} />;
        continueWatchingDisabled = false;
        continueWatchingTitle = "Riprendi visione";
        onContinueWatchingClick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!currentProfile) return;
          const newStatus = (item?.progress || 0) > 0 ? 'watching' : 'plan_to_watch';
          updateOptimistic({ status: newStatus });
          await addToWatchList(currentProfile.id, {
            tmdbId, mediaType, title, releaseDate, posterPath, rating: voteAverage,
            status: newStatus, totalDuration, genres
          });
          router.refresh();
          if (onStatusChange) onStatusChange();
        };
      } else {
        // watching or plan_to_watch
        continueWatchingIcon = <EyeOff size={14} />;
        continueWatchingDisabled = false;
        continueWatchingTitle = "Smetti seguire / Rimuovi";
        onContinueWatchingClick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!currentProfile) return;
          // For non-favorite, "EyeOff" usually means "Remove from list" completely or "Drop"?
          // Let's stick to "dropped" for consistency, or if plan_to_watch maybe just remove status?
          // The previous logic for plan_to_watch was "remove".
          const newStatus = 'dropped';
          updateOptimistic({ status: newStatus });
          await addToWatchList(currentProfile.id, {
            tmdbId, mediaType, title, releaseDate, posterPath, rating: voteAverage,
            status: newStatus, totalDuration, genres
          });
          router.refresh();
          if (onStatusChange) onStatusChange();
        };
      }
    }
  }

  if (minimal) {
    return (
      <div className="flex flex-col gap-2">

        {showContinueWatching && (
          <button
            onClick={!continueWatchingDisabled ? onContinueWatchingClick : undefined}
            disabled={continueWatchingDisabled}
            className={`p-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all z-10 
              ${continueWatchingDisabled
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-black/60 text-white hover:bg-white hover:text-black'}`}
            title={continueWatchingTitle}
          >
            {continueWatchingIcon}
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
    <div className={`flex w-full sm:w-xs flex-row items-center gap-3 ${className}`}>
      {/* Continue Watching Button for non-minimal */}
      {showContinueWatching && (
        <button
          onClick={!continueWatchingDisabled ? onContinueWatchingClick : undefined}
          disabled={continueWatchingDisabled}
          className={`p-4 rounded-2xl w-full sm:w-fit border flex gap-2 items-center justify-center transition-colors 
            ${continueWatchingDisabled
              ? 'border-white/10 text-zinc-500 cursor-not-allowed'
              : 'border-white/20 hover:bg-white/10 text-white'}`}
          title={continueWatchingTitle}
        >
          <p className="sm:hidden">
            {continueWatchingTitle || "Watchlist"}
          </p>
          {continueWatchingIcon}
        </button>
      )}

      <button
        onClick={handleToggleFavorite}
        className={`p-4 rounded-2xl w-full sm:w-fit border flex gap-2 items-center justify-center border-white/20 hover:bg-white/10 transition-colors ${isFavorite ? 'text-red-500 border-red-500/50' : 'text-white'}`}
        title="Mi piace"
      >
        <p className="sm:hidden">
          Mi piace
        </p>
        <ThumbsUp size={16} fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

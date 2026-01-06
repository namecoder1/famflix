'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, ThumbsUp, Trash2, Eye, EyeOff } from 'lucide-react';
import { addToWatchList, removeFromWatchList, toggleFavorite, getWatchStatus, removeFromContinueWatching } from '@/lib/actions';
import { useProfile } from '@/components/ProfileProvider';
import { useRouter } from 'next/navigation';

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
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (currentProfile) {
      checkStatus();
    }
  }, [currentProfile, tmdbId]);

  async function checkStatus() {
    if (!currentProfile) return;
    const res = await getWatchStatus(currentProfile.id, tmdbId);
    if (res) {
      setIsInWatchlist(true);
      setIsFavorite(res.isFavorite === true);
      setStatus(res.status);
    } else {
      setIsInWatchlist(false);
      setIsFavorite(false);
      setStatus(null);
    }
  }

  async function handleToggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click

    if (!currentProfile) {
      alert('Seleziona un profilo prima!');
      return;
    }

    if (isInWatchlist) {
      await removeFromWatchList(currentProfile.id, tmdbId);
      setIsInWatchlist(false);
      setStatus(null);
    } else {
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
      setIsInWatchlist(true);
      setStatus('plan_to_watch');
    }
    router.refresh();
    if (onStatusChange) onStatusChange();
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentProfile) return;

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

    if (!isInWatchlist) {
      setIsInWatchlist(true);
      setStatus('plan_to_watch');
    }

    await toggleFavorite(currentProfile.id, tmdbId, !isFavorite);
    setIsFavorite(!isFavorite);
    router.refresh();
    if (onStatusChange) onStatusChange();
  }

  async function handleRemoveFromContinueWatching(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentProfile) return;

    await removeFromContinueWatching(currentProfile.id, tmdbId);
    setStatus(null);
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
        {(status === 'watching' || (status as any)?.progress > 0) && (
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

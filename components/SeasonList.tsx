'use client';

import { SeasonDetails, TVShowDetails } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import { useState } from 'react';
import { Clock, Play, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Progress } from './ui/progress';

export default function SeasonList({
  showId,
  seasons,
  watchStatus,
  episodeProgress
}: {
  showId: number;
  seasons: SeasonDetails[];
  watchStatus?: any;
  episodeProgress?: Record<number, { progress: number; duration: number }>;
}) {
  // Sort seasons by number
  const sortedSeasons = seasons.sort((a, b) => a.season_number - b.season_number);
  const [activeSeasonId, setActiveSeasonId] = useState<number>(sortedSeasons[0]?.season_number || 1);

  // Auto-select season based on progress
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current && watchStatus?.lastSeason) {
      setActiveSeasonId(watchStatus.lastSeason);
      mounted.current = true;
    }
  }, [watchStatus]);

  const activeSeason = sortedSeasons.find(s => s.season_number === activeSeasonId);

  return (
    <div className="space-y-8">
      {/* Season Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {sortedSeasons.map(season => {
          // Check if this season is fully watched (simplified check)
          const isFullyWatched = watchStatus && (season.season_number < (watchStatus.lastSeason || 0));

          return (
            <button
              key={season.season_number}
              onClick={() => setActiveSeasonId(season.season_number)}
              className={cn(
                "px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors border flex items-center gap-2",
                activeSeasonId === season.season_number
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
              )}
            >
              {season.season_number === 0 ? "Speciali" : `Stagione ${season.season_number}`}
              {isFullyWatched && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Episodes List */}
      {activeSeason && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {activeSeason.season_number === 0 ? "Speciali" : `Stagione ${activeSeason.season_number}`}
              </h2>
              <p className="text-zinc-400 text-sm max-w-2xl">{activeSeason.overview}</p>
            </div>
            <div className="text-sm text-zinc-500 text-right shrink-0">
              {activeSeason.air_date?.split('-')[0]} • {activeSeason.episodes.length} Episodi
            </div>
          </div>

          <div className="grid gap-4">
            {activeSeason.episodes.map(episode => {
              const progressData = episodeProgress?.[episode.id];

              const progress = progressData?.progress || 0;
              let duration = progressData?.duration || 0;

              // Fallback to episode runtime (minutes -> seconds) if duration is missing
              if (!duration && episode.runtime) {
                duration = episode.runtime * 60;
              }

              const percentage = duration > 0 ? (progress / duration) * 100 : 0;

              // Definition of "watched": either > 90% progress OR explicitly marked as previous in sequential order (fallback)
              const isWatched = percentage > 90 || (watchStatus && (
                activeSeason.season_number < (watchStatus.lastSeason || 0) ||
                (activeSeason.season_number === watchStatus.lastSeason && episode.episode_number < (watchStatus.lastEpisode || 0))
              ));

              // "Current" is strictly where we left off, OR if we have significant progress on this specific episode
              const isCurrent = (watchStatus &&
                activeSeason.season_number === watchStatus.lastSeason &&
                episode.episode_number === watchStatus.lastEpisode) || (percentage > 0 && percentage <= 90);

              return (
                <Link
                  key={episode.id}
                  href={`/tv/${showId}/watch?season=${activeSeason.season_number}&episode=${episode.episode_number}`}
                  className={cn(
                    "group flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all",
                    "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                    <img
                      src={getImageUrl(episode.still_path, 'w500')}
                      alt={episode.name}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                        isWatched && "grayscale-[0.5]"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                        <Play className="fill-white w-6 h-6" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 flex gap-2">
                      {!isWatched && !isCurrent && (
                        <div className="px-2 py-1 bg-black/80 rounded text-xs text-white font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {episode.runtime || 24}m
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {percentage > 0 && percentage < 100 && (
                      <Progress className="w-full absolute bottom-0 left-0 right-0" value={percentage} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 py-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={cn(
                          "font-bold text-lg transition-colors",
                          isCurrent ? "text-red-400" : "text-zinc-200 group-hover:text-white"
                        )}>
                          {episode.episode_number}. {episode.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {episode.air_date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                      {episode.overview || "Nessuna descrizione disponibile."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

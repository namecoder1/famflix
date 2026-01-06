'use client';

import { TVShowDetails, Season } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
// import ProgressTracker from '@/components/ProgressTracker'; // Removed as per refactor plan
import VideoPlayer from '@/components/VideoPlayer';

export default function TVSeriesPlayer({ show }: { show: TVShowDetails }) {
  // Filter out season 0 (specials) usually, or keep it if desired. 
  // Let's filter empty seasons or keep all.
  const seasons = show.seasons.filter(s => s.season_number > 0);

  const [selectedSeason, setSelectedSeason] = useState<Season>(seasons[0] || show.seasons[0]);
  const [episode, setEpisode] = useState(1);

  // VixSrc format: https://vixsrc.to/tv/{tmdbId}/{season}/{episode}
  const src = `https://vixsrc.to/tv/${show.id}/${selectedSeason?.season_number}/${episode}`;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Player Column */}
      <div className="flex-1">
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 relative z-20">
          <VideoPlayer
            key={`${selectedSeason?.season_number}-${episode}`} // Force re-render on change
            tmdbId={show.id}
            season={selectedSeason?.season_number}
            episode={episode}
            mediaType="tv"
            title={`S${selectedSeason?.season_number}:E${episode} - ${selectedSeason?.name}`}
            posterPath={show.poster_path || ''}
            startTime={0} // Default to 0 for this internal player view
          />
        </div>
        <div className="mt-4 flex items-center justify-between px-2">
          <h3 className="text-xl font-bold">
            S{selectedSeason?.season_number}:E{episode} - {selectedSeason?.name}
          </h3>
        </div>
      </div>

      {/* Episode Selector Column */}
      <div className="w-full lg:w-80 flex flex-col h-[500px] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {/* Season Selector */}
        <div className="p-4 border-b border-zinc-800">
          <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-2 block">Stagione</label>
          <div className="relative">
            <select
              value={selectedSeason?.id}
              onChange={(e) => {
                const season = show.seasons.find(s => s.id === Number(e.target.value));
                if (season) {
                  setSelectedSeason(season);
                  setEpisode(1); // Reset to ep 1
                }
              }}
              className="w-full bg-zinc-800 text-white appearance-none py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
              {seasons.map(s => (
                <option key={s.id} value={s.id}>
                  Stagione {s.season_number}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Episode List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {selectedSeason && Array.from({ length: selectedSeason.episode_count }, (_, i) => i + 1).map((epNum) => (
            <button
              key={epNum}
              onClick={() => setEpisode(epNum)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left mb-1",
                episode === epNum
                  ? "bg-red-600 text-white shadow-lg"
                  : "hover:bg-zinc-800 text-zinc-300"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                episode === epNum ? "bg-white text-red-600" : "bg-zinc-800 text-zinc-500"
              )}>
                {episode === epNum ? <Play className="w-3 h-3 fill-current ml-0.5" /> : epNum}
              </div>
              <span className="truncate font-medium">Episodio {epNum}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

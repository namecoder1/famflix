import { getTVShowDetails, getImageUrl, getSeasonDetails } from '@/lib/tmdb';
import { Star, Calendar, Play } from 'lucide-react';
import SeasonList from '@/components/SeasonList';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getWatchStatus, getEpisodeProgress } from '@/lib/actions';

export default async function TVShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const show = await getTVShowDetails(id);
  const backdrop = getImageUrl(show.backdrop_path, 'original');

  // Fetch all seasons in parallel
  // We filter out any seasons that might not have a season number (rare data issue safeguard)
  const seasonsPromises = show.seasons.map(s => getSeasonDetails(id, s.season_number));
  const fullSeasons = await Promise.all(seasonsPromises);

  const cookieStore = await cookies();
  const profileId = cookieStore.get('profile_id')?.value;
  let watchStatus = null;
  let episodeProgress: Record<number, { progress: number; duration: number }> = {};

  if (profileId) {
    const [status, progressList] = await Promise.all([
      getWatchStatus(profileId, Number(id)),
      getEpisodeProgress(profileId, Number(id))
    ]);
    watchStatus = status;

    // Map progress by Episode ID
    // We iterate over fetched seasons/episodes to match them with DB progress
    episodeProgress = {};

    // Create a quick lookup for progress by season_episode
    const progressLookup = new Map();
    progressList.forEach((p: any) => {
      progressLookup.set(`${p.season_number}_${p.episode_number}`, p);
    });

    // Now iterate full seasons to link ID -> Progress
    fullSeasons.forEach(season => {
      season.episodes.forEach(episode => {
        const p = progressLookup.get(`${episode.season_number}_${episode.episode_number}`);
        if (p) {
          episodeProgress[episode.id] = {
            progress: p.progress,
            duration: p.duration
          };
        }
      });
    });
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Heavy Hero/Header */}
      <div className="relative w-full h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <img src={backdrop} alt={show.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-10 z-10">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">{show.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-zinc-300 mb-6">
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star className="fill-yellow-400 w-5 h-5" /> {show.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-5 h-5" /> {show.first_air_date.split('-')[0]}
              </span>
              <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs bg-zinc-900/50">
                {show.number_of_seasons} Stagioni
              </span>
              <div className="flex gap-2">
                {show.genres.map(g => (
                  <span key={g.id} className="text-zinc-400">{g.name}</span>
                ))}
              </div>
            </div>

            <p className="max-w-3xl text-lg text-zinc-300 line-clamp-3 mb-8 drop-shadow-md">
              {show.overview}
            </p>

            <div className="flex gap-4">
              <Link
                href={`/tv/${id}/watch?season=1&episode=1`}
                className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-red-900/20"
              >
                <Play className="fill-white w-6 h-6" />
                Inizia a guardare
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <SeasonList showId={show.id} seasons={fullSeasons} watchStatus={watchStatus} episodeProgress={episodeProgress} />
      </div>
    </main>
  );
}

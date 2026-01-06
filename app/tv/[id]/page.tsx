import { getTVShowDetails, getImageUrl } from '@/lib/tmdb';
import { Star, Calendar } from 'lucide-react';
import TVSeriesPlayer from '@/components/TVSeriesPlayer';

export default async function TVShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const show = await getTVShowDetails(id);
  const backdrop = getImageUrl(show.backdrop_path, 'original');

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Heavy Hero/Header */}
      <div className="relative w-full h-[50vh]">
         <div className="absolute inset-0">
             <img src={backdrop} alt={show.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
         </div>
         <div className="absolute bottom-0 left-0 w-full p-4 md:p-10 z-10">
            <div className="container mx-auto">
                <h1 className="text-4xl md:text-5xl font-black mb-4">{show.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-zinc-300 mb-4">
                     <span className="flex items-center gap-1 text-yellow-400 font-bold">
                        <Star className="fill-yellow-400 w-4 h-4" /> {show.vote_average.toFixed(1)}
                     </span>
                     <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {show.first_air_date.split('-')[0]}
                     </span>
                     <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs">
                        {show.number_of_seasons} Stagioni
                     </span>
                     <div className="flex gap-2">
                        {show.genres.map(g => (
                            <span key={g.id} className="text-zinc-400">{g.name}</span>
                        ))}
                     </div>
                </div>
                <p className="max-w-3xl text-zinc-400 line-clamp-2 md:line-clamp-none">
                    {show.overview}
                </p>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 py-8">
         <TVSeriesPlayer show={show} />
      </div>
    </main>
  );
}

import { getMovieDetails, getImageUrl } from '@/lib/tmdb';
import { Star, Clock, Calendar } from 'lucide-react';

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  const backdrop = getImageUrl(movie.backdrop_path, 'original');

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0">
          <img 
            src={backdrop} 
            alt={movie.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>
        <div className="container mx-auto px-4 h-full flex items-end pb-10 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base text-zinc-300 mb-6">
              <span className="flex items-center gap-2 text-yellow-400 font-bold">
                <Star className="fill-yellow-400 w-5 h-5" /> {movie.vote_average.toFixed(1)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> {movie.runtime} min
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> {movie.release_date.split('-')[0]}
              </span>
              <div className="flex gap-2">
                {movie.genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 bg-zinc-800 rounded-full text-xs border border-zinc-700">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-lg text-zinc-300 leading-relaxed drop-shadow-md">
              {movie.overview}
            </p>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <div className="container mx-auto px-4 py-10">
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-zinc-800">
          <iframe
            src={`https://vixsrc.to/movie/${movie.id}`}
            className="w-full h-full"
            title="Movie Player"
            allowFullScreen
            allow="autoplay; encrypted-media"
            referrerPolicy="origin"
          />
        </div>
        <div className="mt-4 text-center text-sm text-zinc-500">
          Se il video non parte, prova a ricaricare la pagina o disattivare AdBlock.
        </div>
      </div>
    </main>
  );
}

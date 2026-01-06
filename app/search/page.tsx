import { searchContent } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;
  const results = await searchContent(q);

  return (
    <main className="min-h-screen pt-24 pb-10 px-4 container mx-auto bg-zinc-950">
      <h1 className="text-3xl font-bold text-white mb-8">
        Risultati per: <span className="text-red-600">"{q}"</span>
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-zinc-400 text-center py-20">
          <p className="text-xl">Nessun risultato trovato.</p>
        </div>
      )}
    </main>
  );
}

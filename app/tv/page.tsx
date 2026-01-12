

import type { Metadata } from 'next';
import CategorySection from '@/components/CategorySection';
import { getTVGenres, getTVShowsByGenre } from '@/lib/tmdb';
import LazyCategoryRow from '@/components/LazyCategoryRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import GenreFilter from '@/components/GenreFilter';
import MovieCard from '@/components/MovieCard';

export const metadata: Metadata = {
  title: "Famflix | Serie TV",
  description: "Esplora le migliori serie TV per tutta la famiglia",
};

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre: genreId } = await searchParams;
  const genres = await getTVGenres();

  let filteredShows = null;
  let selectedGenreName = "";

  if (genreId) {
    const pages = [1, 2, 3, 4];
    const results = await Promise.all(
      pages.map((page) => getTVShowsByGenre(parseInt(genreId), page))
    );
    // Deduplicate results by ID
    const uniqueShows = new Map();
    results.flat().forEach(show => {
      uniqueShows.set(show.id, show);
    });
    filteredShows = Array.from(uniqueShows.values());

    selectedGenreName = genres.find((g) => g.id.toString() === genreId)?.name || "";
  }

  let initialCategories: any[] = [];
  let remainingGenres: { id: number; name: string }[] = [];

  if (!genreId) {
    const initialGenres = genres.slice(0, 2);
    remainingGenres = genres.slice(2);

    initialCategories = await Promise.all(
      initialGenres.map(async (genre) => {
        const shows = await getTVShowsByGenre(genre.id);
        return { ...genre, shows };
      })
    );
  }

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-4xl font-bold text-white mb-2'>
            {selectedGenreName ? `Serie TV: ${selectedGenreName}` : "Serie TV"}
          </h1>
          <p className='text-zinc-400'>
            {selectedGenreName
              ? `Esplora le serie TV del genere ${selectedGenreName}`
              : "Esplora le serie TV per categoria"}
          </p>
        </div>
        <GenreFilter genres={genres} />
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        {!genreId && <ContinueWatchingSection mediaType="tv" />}

        {genreId && filteredShows ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredShows.map((item) => (
              <MovieCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <>
            {/* Initial Categories (Server Rendered) */}
            {initialCategories.map((category) => (
              <CategorySection
                key={category.id}
                title={category.name}
                items={category.shows}
              />
            ))}

            {/* Lazy Categories (Client + Server Action) */}
            {remainingGenres.map((genre, index) => (
              <LazyCategoryRow
                key={genre.id}
                title={genre.name}
                genreId={genre.id}
                type="tv"
                delayIndex={index}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
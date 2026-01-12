

import type { Metadata } from 'next';
import CategorySection from '@/components/CategorySection';
import { getMovieGenres, getMoviesByGenre } from '@/lib/tmdb';
import LazyCategoryRow from '@/components/LazyCategoryRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import GenreFilter from '@/components/GenreFilter';
import MovieCard from '@/components/MovieCard';

export const metadata: Metadata = {
  title: "Famflix | Film",
  description: "Esplora la nostra vasta collezione di film per tutta la famiglia",
};

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre: genreId } = await searchParams;
  const genres = await getMovieGenres();

  let filteredMovies = null;
  let selectedGenreName = "";

  if (genreId) {
    const pages = [1, 2, 3, 4];
    const results = await Promise.all(
      pages.map((page) => getMoviesByGenre(parseInt(genreId), page))
    );
    // Deduplicate results by ID
    const uniqueMovies = new Map();
    results.flat().forEach(movie => {
      uniqueMovies.set(movie.id, movie);
    });
    filteredMovies = Array.from(uniqueMovies.values());

    selectedGenreName = genres.find((g) => g.id.toString() === genreId)?.name || "";
  }

  // If filtering, we don't need initial/remaining categories logic for the grid view
  // But if NOT filtering, we do.

  let initialCategories: any[] = [];
  let remainingGenres: { id: number; name: string }[] = [];

  if (!genreId) {
    const initialGenres = genres.slice(0, 2);
    remainingGenres = genres.slice(2);

    initialCategories = await Promise.all(
      initialGenres.map(async (genre) => {
        const movies = await getMoviesByGenre(genre.id);
        return { ...genre, movies };
      })
    );
  }

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-4xl font-bold text-white mb-2'>
            {selectedGenreName ? `Film: ${selectedGenreName}` : "Film"}
          </h1>
          <p className='text-zinc-400'>
            {selectedGenreName
              ? `Esplora i film del genere ${selectedGenreName}`
              : "Esplora i film per categoria"}
          </p>
        </div>
        <GenreFilter genres={genres} />
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        {!genreId && <ContinueWatchingSection mediaType="movie" />}

        {genreId && filteredMovies ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((item) => (
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
                items={category.movies}
              />
            ))}

            {/* Lazy Categories (Client + Server Action) */}
            {remainingGenres.map((genre, index) => (
              <LazyCategoryRow
                key={genre.id}
                title={genre.name}
                genreId={genre.id}
                type="movie"
                delayIndex={index}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
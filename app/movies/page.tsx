import type { Metadata } from 'next';
import CategorySection from '@/components/CategorySection';
import { getMovieGenres, getMoviesByGenre } from '@/lib/tmdb';
import LazyCategoryRow from '@/components/LazyCategoryRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';

export const metadata: Metadata = {
  title: "Famflix | Film",
  description: "Esplora la nostra vasta collezione di film per tutta la famiglia",
};

const MoviesPage = async () => {
  const genres = await getMovieGenres();

  // Load first 2 categories immediately
  const initialGenres = genres.slice(0, 2);
  const remainingGenres = genres.slice(2);

  // Fetch movies for initial genres in parallel
  const initialCategories = await Promise.all(
    initialGenres.map(async (genre) => {
      const movies = await getMoviesByGenre(genre.id);
      return { ...genre, movies };
    })
  );

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Film</h1>
        <p className='text-zinc-400'>Esplora i film per categoria</p>
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        <ContinueWatchingSection mediaType="movie" />

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
      </div>
    </div>
  )
}

export default MoviesPage
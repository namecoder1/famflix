import type { Metadata } from 'next';
import CategorySection from '@/components/CategorySection';
import { getTVGenres, getTVShowsByGenre } from '@/lib/tmdb';
import LazyCategoryRow from '@/components/LazyCategoryRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';

export const metadata: Metadata = {
  title: "Famflix | Serie TV",
  description: "Esplora le migliori serie TV per tutta la famiglia",
};

const SeriesPage = async () => {
  const genres = await getTVGenres();

  // Load first 2 categories immediately
  const initialGenres = genres.slice(0, 2);
  const remainingGenres = genres.slice(2);

  const initialCategories = await Promise.all(
    initialGenres.map(async (genre) => {
      const shows = await getTVShowsByGenre(genre.id);
      return { ...genre, shows };
    })
  );

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Serie TV</h1>
        <p className='text-zinc-400'>Esplora le serie TV per categoria</p>
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        <ContinueWatchingSection mediaType="tv" />

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
      </div>
    </div>
  )
}

export default SeriesPage
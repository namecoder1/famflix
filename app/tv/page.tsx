import CategorySection from '@/components/CategorySection';
import { getTVGenres, getTVShowsByGenre } from '@/lib/tmdb';

import LazyCategoryRow from '@/components/LazyCategoryRow';
import React from 'react'
import { cookies } from 'next/headers';
import { getWatchList } from '@/lib/actions';

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

  // Get active profile and watching TV
  const cookieStore = await cookies();
  const profileId = cookieStore.get('profile_id')?.value;
  let watchingTV: any[] = [];

  if (profileId) {
    const allWatched = await getWatchList(profileId);
    watchingTV = allWatched
      .filter(item => item.status === 'watching' && item.mediaType === 'tv')
      .map(item => ({
        ...item,
        id: item.tmdbId,
        poster_path: item.posterPath,
        media_type: item.mediaType,
        vote_average: item.rating || 0,
        first_air_date: item.releaseDate,
        name: item.title,
      }));
  }

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Serie TV</h1>
        <p className='text-zinc-400'>Esplora le serie TV per categoria</p>
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        {watchingTV.length > 0 && (
          <CategorySection
            title="Serie TV che stai guardando"
            items={watchingTV}
            showStatusToggle={true}
          />
        )}

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
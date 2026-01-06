import CategorySection from '@/components/CategorySection';
import { getMovieGenres, getMoviesByGenre } from '@/lib/tmdb';

import LazyCategoryRow from '@/components/LazyCategoryRow';
import React from 'react'
import { cookies } from 'next/headers';
import { getWatchList } from '@/lib/actions';

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

  // Get active profile and watching movies
  const cookieStore = await cookies();
  const profileId = cookieStore.get('profile_id')?.value;
  let watchingMovies: any[] = [];

  if (profileId) {
    const allWatched = await getWatchList(profileId);
    watchingMovies = allWatched
      .filter(item => item.status === 'watching' && item.mediaType === 'movie')
      .map(item => ({
        ...item,
        id: item.tmdbId,
        poster_path: item.posterPath,
        media_type: item.mediaType,
        vote_average: item.rating || 0,
        release_date: item.releaseDate,
      }));
  }

  return (
    <div className='min-h-screen bg-zinc-950 pt-24 pb-20'>
      <div className='container mx-auto px-4 mb-8'>
        <h1 className='text-4xl font-bold text-white mb-2'>Film</h1>
        <p className='text-zinc-400'>Esplora i film per categoria</p>
      </div>

      <div className='container mx-auto px-4 flex flex-col gap-8'>
        {watchingMovies.length > 0 && (
          <CategorySection
            title="Film che stai guardando"
            items={watchingMovies}
            showStatusToggle={true}
          />
        )}

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
import { getTrending } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import Hero from '@/components/Hero';
import { cookies } from 'next/headers';
import { getWatchList } from '@/lib/actions';
import CategorySection from '@/components/CategorySection';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const trending = await getTrending();
  const heroItem = trending[0];
  const rest = trending.slice(1);

  // Get active profile from cookies
  const cookieStore = await cookies();
  const profileId = cookieStore.get('profile_id')?.value;

  let myList: any[] = [];
  let continueWatching: any[] = [];

  if (profileId) {
    const allWatched = await getWatchList(profileId);

    // Filter for "My List" (Plan to watch)
    myList = allWatched.filter(item => item.status === 'plan_to_watch').map(item => ({
      ...item,
      id: item.tmdbId,
      poster_path: item.posterPath,
      media_type: item.mediaType,
      vote_average: item.rating || 0, // Fallback
      release_date: item.releaseDate,
      first_air_date: item.releaseDate,
      name: item.mediaType === 'tv' ? item.title : undefined,
    }));

    // Filter for "Continue Watching" (Watching)
    continueWatching = allWatched.filter(item => item.status === 'watching').map(item => ({
      ...item,
      id: item.tmdbId,
      poster_path: item.posterPath,
      media_type: item.mediaType,
      vote_average: item.rating || 0,
      release_date: item.releaseDate,
      first_air_date: item.releaseDate,
      name: item.mediaType === 'tv' ? item.title : undefined,
    }));

  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-20">
      {heroItem && <Hero item={heroItem} />}

      <div className="container mx-auto px-4 -mt-20 relative z-20 space-y-8">

        {continueWatching.length > 0 && (
          <CategorySection title="Continua a guardare" items={continueWatching} showStatusToggle={true} />
        )}

        <CategorySection title="Top della Settimana" items={rest} />
      </div>
    </main>
  );
}

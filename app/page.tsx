import { getTrending } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import Hero from '@/components/Hero';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const trending = await getTrending();
  const heroItem = trending[0];
  const rest = trending.slice(1);

  return (
    <main className="min-h-screen bg-zinc-950 pb-20">
      {heroItem && <Hero item={heroItem} />}
      
      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          Top della Settimana
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {rest.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}

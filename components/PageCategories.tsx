import { getTrending, getPopularMovies, getPopularTVShows } from '@/lib/tmdb';
import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';

export async function TrendingHero() {
  const trending = await getTrending('week');
  const featured = trending[0];
  return featured ? <Hero item={featured} /> : null;
}

export async function TrendingSection() {
  const trending = await getTrending('week');
  // First item is potentially hero, so slice if hero is shown. 
  // However, Hero component assumes it's passed 'featured'.
  // Ideally, Page passes 'featured' to Hero, and 'remaining' to this category.
  // BUT, to split them entirely, we might just slice here too.
  const remaining = trending.slice(1);
  
  return (
    <CategorySection
       title="Di Tendenza in Italia"
       items={remaining}
    />
  );
}

export async function PopularMoviesSection() {
  const popularMovies = await getPopularMovies();
  return (
    <CategorySection
       title="Film Popolari"
       items={popularMovies}
    />
  );
}

export async function PopularTVSection() {
  const popularTV = await getPopularTVShows();
  return (
    <CategorySection
       title="Serie TV Popolari"
       items={popularTV}
    />
  );
}

import { Suspense } from 'react';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import { TrendingHero, TrendingSection, PopularMoviesSection, PopularTVSection } from '@/components/PageCategories';

export const revalidate = 3600; // Revalidate every hour

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 pb-20">
      <Suspense fallback={<div className="h-[50vh] w-full bg-zinc-900 animate-pulse" />}>
        <TrendingHero />
      </Suspense>
      
      <div className="container mx-auto px-4 -mt-32 relative z-20 flex flex-col gap-12">
        
        {/* Client side component - loads immediately if user data exists in provider */}
        <ContinueWatchingSection />

        <Suspense fallback={<div className="h-64 w-full bg-zinc-900/50 rounded-xl animate-pulse" />}>
          <TrendingSection />
        </Suspense>

        <Suspense fallback={<div className="h-64 w-full bg-zinc-900/50 rounded-xl animate-pulse" />}>
          <PopularMoviesSection />
        </Suspense>

        <Suspense fallback={<div className="h-64 w-full bg-zinc-900/50 rounded-xl animate-pulse" />}>
           <PopularTVSection />
        </Suspense>
      </div>
    </main>
  );
}

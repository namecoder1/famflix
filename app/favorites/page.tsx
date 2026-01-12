'use client';
import { useProfile } from '@/components/ProfileProvider';
import { ContentItem } from '@/lib/types';
import { Heart } from 'lucide-react';
import React, { useMemo, useEffect } from 'react';
import CategorySection from '@/components/CategorySection';
import { useUserMedia } from '@/components/UserMediaProvider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchMovieCredits, fetchTVCredits } from '@/lib/actions';

const FavoritesPage = () => {
  const { currentProfile } = useProfile();
  const { userMedia, isLoading } = useUserMedia();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>('newest');
  const [selectedGenre, setSelectedGenre] = React.useState<string>('all');
  const [castData, setCastData] = React.useState<Map<number, string[]>>(new Map());
  const [loadingCast, setLoadingCast] = React.useState(false);

  // Progressive loading state
  const [visibleMovies, setVisibleMovies] = React.useState(20);
  const [visibleSeries, setVisibleSeries] = React.useState(20);

  // Refs for intersection observers
  const moviesEndRef = React.useRef<HTMLDivElement>(null);
  const seriesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch cast data only when searching (lazy loading)
  useEffect(() => {
    const fetchCastDataForSearch = async () => {
      // Only fetch if user is searching and we don't have all cast data yet
      if (!searchQuery.trim() || !currentProfile) return;

      const favorites = Array.from(userMedia.values()).filter(item => item.isFavorite);
      if (favorites.length === 0) return;

      // Check if we need to fetch any cast data
      const itemsWithoutCast = favorites.filter(item => !castData.has(item.tmdbId));
      if (itemsWithoutCast.length === 0) return;

      setLoadingCast(true);
      const newCastData = new Map(castData);

      try {
        // Fetch in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < itemsWithoutCast.length; i += batchSize) {
          const batch = itemsWithoutCast.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (item) => {
              try {
                const result = item.mediaType === 'movie'
                  ? await fetchMovieCredits(item.tmdbId.toString())
                  : await fetchTVCredits(item.tmdbId.toString());

                if (result.success && result.data) {
                  const castNames = result.data.cast
                    .slice(0, 10)
                    .map((member: any) => member.name.toLowerCase());
                  newCastData.set(item.tmdbId, castNames);
                } else {
                  newCastData.set(item.tmdbId, []);
                }
              } catch (error) {
                console.error(`Failed to fetch credits for ${item.title}:`, error);
                newCastData.set(item.tmdbId, []);
              }
            })
          );

          // Update state after each batch
          setCastData(new Map(newCastData));
        }
      } catch (error) {
        console.error('Failed to fetch cast data:', error);
      } finally {
        setLoadingCast(false);
      }
    };

    fetchCastDataForSearch();
  }, [searchQuery, userMedia, currentProfile]);

  // Reset visible counts when search or filters change
  useEffect(() => {
    setVisibleMovies(20);
    setVisibleSeries(20);
  }, [searchQuery, selectedGenre, sortOrder]);

  // Intersection Observer for movies
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleMovies(prev => prev + 20);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = moviesEndRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Intersection Observer for series
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleSeries(prev => prev + 20);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = seriesEndRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!currentProfile) return { movies: [], series: [] };

    let items = Array.from(userMedia.values())
      .filter(item => item.isFavorite) // Only favorites
      .map(item => ({
        ...item,
        // Ensure properties needed for ContentItem and sorting are present
        name: item.mediaType === 'tv' ? (item.title || '') : '',
        title: item.title || '',
        vote_average: item.rating || 0,
        release_date: item.releaseDate || '',
        first_air_date: item.releaseDate || '',
        id: item.tmdbId,
        media_type: item.mediaType,
        poster_path: item.posterPath || '',
        // Add required fields to match ContentItem type
        backdrop_path: '',
        overview: '',
        genre_ids: [],
        original_language: '',
        popularity: 0,
        vote_count: 0,
        video: false,
        adult: false,
      }));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        // Search by title
        const titleMatch = (item.title || '').toLowerCase().includes(query);

        // Search by actor names
        const cast = castData.get(item.tmdbId) || [];
        const castMatch = cast.some(actorName => actorName.includes(query));

        return titleMatch || castMatch;
      });
    }

    // Filter by genre
    if (selectedGenre && selectedGenre !== 'all') {
      items = items.filter(item =>
        // @ts-ignore - genres exists on UserMediaItem but not explicitly on ContentItem in some contexts
        item.genres && item.genres.some((g: any) => g.name === selectedGenre)
      );
    }

    // Sort items
    items.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Split into categories
    const movies = items.filter(item => item.mediaType === 'movie');
    const series = items.filter(item => item.mediaType === 'tv');

    return { movies, series };
  }, [userMedia, currentProfile, searchQuery, sortOrder, selectedGenre, castData]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    Array.from(userMedia.values())
      .filter(item => item.isFavorite) // Only favorites
      .forEach(item => {
        if (item.genres && Array.isArray(item.genres)) {
          item.genres.forEach(g => {
            if (g.name) genres.add(g.name);
          });
        }
      });
    return Array.from(genres).sort();
  }, [userMedia]);

  if (!currentProfile) {
    return (
      <div className='min-h-screen bg-black pt-24 pb-10 flex items-center justify-center'>
        <div className="text-center">
          <h1 className='text-4xl font-bold text-white mb-4'>Preferiti</h1>
          <p className='text-zinc-400'>Seleziona un profilo per vedere i tuoi preferiti.</p>
        </div>
      </div>
    );
  }

  const hasFavorites = userMedia.size > 0 && Array.from(userMedia.values()).some(i => i.isFavorite);
  const showContent = filteredItems.movies.length > 0 || filteredItems.series.length > 0;

  return (
    <div className='min-h-[80vh] bg-black pt-24 pb-10'>
      <div className='container mx-auto px-4 mb-8'>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className='text-4xl font-bold text-white'>I tuoi Preferiti</h1>
            <p className='text-zinc-400 mt-1'>Tutti i film e le serie TV che ami.</p>
          </div>

          {/* Controls */}
          {hasFavorites && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Cerca per titolo o attore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {loadingCast && searchQuery.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className='flex w-full items-center gap-2'>
                <Select value={sortOrder} onValueChange={setSortOrder as any}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Ordina per" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Più recenti</SelectItem>
                    <SelectItem value='oldest'>Meno recenti</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tutti i generi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i generi</SelectItem>
                    {allGenres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='container mx-auto px-4 space-y-12'>
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[160px] h-[240px] bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !hasFavorites ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">Non hai ancora aggiunto nulla ai preferiti.</p>
          </div>
        ) : !showContent ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">Nessun risultato trovato per &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <>
            {filteredItems.movies.length > 0 && (
              <div>
                <CategorySection
                  title="Film Preferiti"
                  items={filteredItems.movies.slice(0, visibleMovies) as ContentItem[]}
                  showStatusToggle={false}
                />
                {filteredItems.movies.length > visibleMovies && (
                  <div ref={moviesEndRef} className="h-20" />
                )}
              </div>
            )}

            {filteredItems.series.length > 0 && (
              <div>
                <CategorySection
                  title="Serie TV Preferite"
                  items={filteredItems.series.slice(0, visibleSeries) as ContentItem[]}
                  showStatusToggle={false}
                />
                {filteredItems.series.length > visibleSeries && (
                  <div ref={seriesEndRef} className="h-20" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage;
